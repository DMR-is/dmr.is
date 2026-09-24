import { Inject, Injectable } from '@nestjs/common'

import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import {
  postApiActionsCloseCase,
  postApiActionsCreateCase,
  postApiActionsCreateDocument,
  postApiActionsSendDocToIslandIs,
  postApiAuthLogin,
} from '../gen/fetch'
import {
  ONESYSTEMS_EMPTY_BEARER_CHALLENGE_BODY,
  ONESYSTEMS_EMPTY_ERROR_BODY,
  oneSystemsActionClient,
  oneSystemsLoginClient,
  oneSystemsTimeoutMs,
  resolveOneSystemsBaseUrl,
} from './onesystems.config'
import {
  hasNoKennitalaShape,
  isOneSystemsError,
  OneSystemsError,
  type OneSystemsNonIdempotentOperation,
  type OneSystemsOperation,
  toLoggableErrorNumber,
} from './onesystems.errors'
import {
  IOneSystemsService,
  OneSystemsCloseCaseInput,
  OneSystemsCloseCaseResult,
  OneSystemsCreateCaseInput,
  OneSystemsCreateCaseResult,
  OneSystemsCreateDocumentInput,
  OneSystemsCreateDocumentResult,
  OneSystemsSendDocToIslandIsInput,
  OneSystemsSendDocToIslandIsResult,
} from './onesystems.service.interface'
import {
  type OneSystemsToken,
  OneSystemsTokenCache,
  parseLoginResponse,
} from './onesystems-token'

const LOGGING_CONTEXT = 'OneSystemsService'
const LOGGING_CATEGORY = 'onesystems-service'

const DEFAULT_EXTENSION = 'PDF'
const DEFAULT_CLOSE_STATUS = 'Lokið'

type ActionOperation = Exclude<OneSystemsOperation, 'Login'>

const NON_IDEMPOTENT_OPERATIONS: ReadonlyArray<ActionOperation> = [
  'CreateDocument',
  'SendDocToIslandIs',
] satisfies ReadonlyArray<OneSystemsNonIdempotentOperation>

type ConfigVariable =
  | 'ONESYSTEMS_API_URL'
  | 'ONESYSTEMS_USERNAME'
  | 'ONESYSTEMS_PASSWORD'

/** What every generated SDK function resolves to when it does not throw. */
interface SdkResult {
  data?: unknown
  error?: unknown
  response?: Response
}

/** A 2xx action response with `Success: true`. */
interface ActionResponse<TItemId extends string | null> {
  itemId: TItemId
  body: Record<string, unknown>
}

type SendAction = (
  common: ReturnType<typeof actionRequestOptions>,
) => Promise<SdkResult>

/**
 * Calls OneExternalAPI (OneSystems' API for Jafnréttisstofa's One case system).
 *
 * Environment, read when a call is made and never at import:
 * - `ONESYSTEMS_API_URL`: the base URL (required; there is no default)
 * - `ONESYSTEMS_USERNAME`, `ONESYSTEMS_PASSWORD`: Login credentials
 *
 * This service is NOT gated by `ONESYSTEMS_ENABLED`; see
 * {@link IOneSystemsService}.
 *
 * Logs carry the operation, HTTP status, One's `ErrorNumber`, body lengths and
 * One's ids. They never carry the token, the password, a kennitala, a name, a
 * subject, the document bytes, a response body or One's `ErrorMessage`.
 */
@Injectable()
export class OneSystemsService implements IOneSystemsService {
  private readonly tokenCache = new OneSystemsTokenCache()

  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {}

  async createCase(
    input: OneSystemsCreateCaseInput,
  ): Promise<OneSystemsCreateCaseResult> {
    const operation = 'CreateCase'
    const body = {
      IDNumber: this.requireText(operation, 'nationalId', input.nationalId),
      CustomerName: this.requireText(
        operation,
        'customerName',
        input.customerName,
      ),
      CaseType: this.requireText(operation, 'caseType', input.caseType),
      Portal: input.portal,
    }
    const response = await this.callAction(operation, (common) =>
      postApiActionsCreateCase({ ...common, body }),
    )
    return {
      caseItemId: response.itemId,
      caseNumber: nonEmptyString(response.body.CaseNumber),
    }
  }

  async createDocument(
    input: OneSystemsCreateDocumentInput,
  ): Promise<OneSystemsCreateDocumentResult> {
    const operation = 'CreateDocument'
    const body = {
      ParentID: this.requireText(operation, 'caseItemId', input.caseItemId),
      Subject: this.requireText(operation, 'subject', input.subject),
      Extension:
        input.extension === undefined
          ? DEFAULT_EXTENSION
          : this.requireText(operation, 'extension', input.extension),
      CreateDate: this.requireDate(operation, input.createDate).toISOString(),
      Author: input.author,
      DocCategory: input.docCategory,
      DocType: input.docType,
      File: this.requireFile(operation, input.file).toString('base64'),
      Portal: input.portal,
    }
    const { itemId } = await this.callAction(operation, (common) =>
      postApiActionsCreateDocument({ ...common, body }),
    )
    return { documentItemId: itemId }
  }

  async sendDocToIslandIs(
    input: OneSystemsSendDocToIslandIsInput,
  ): Promise<OneSystemsSendDocToIslandIsResult> {
    const operation = 'SendDocToIslandIs'
    const body = {
      ItemID: this.requireText(
        operation,
        'documentItemId',
        input.documentItemId,
      ),
      IDNumber: this.requireText(operation, 'nationalId', input.nationalId),
      Category: input.category,
      Type: input.type,
      SendNotification: input.sendNotification,
    }
    const { itemId } = await this.callAction(operation, (common) =>
      postApiActionsSendDocToIslandIs({ ...common, body }),
    )
    return { islandIsDocumentId: itemId }
  }

  async closeCase(
    input: OneSystemsCloseCaseInput,
  ): Promise<OneSystemsCloseCaseResult> {
    const operation = 'CloseCase'
    const body = {
      CaseID: this.requireText(operation, 'caseId', input.caseId),
      StatusName:
        input.statusName === undefined
          ? DEFAULT_CLOSE_STATUS
          : this.requireText(operation, 'statusName', input.statusName),
    }
    const { itemId } = await this.callAction(operation, (common) =>
      postApiActionsCloseCase({ ...common, body }),
    )
    return { caseItemId: itemId }
  }

  /**
   * Sends one action with the current token. On a 401 the token is dropped
   * and the action is sent once more with a fresh one. A second 401 is thrown.
   *
   * CreateCase and CloseCase are safe to repeat, so any 401 is retried.
   * CreateDocument and SendDocToIslandIs are re-sent only on the JwtBearer
   * challenge: an empty-bodied 401 with a `WWW-Authenticate: Bearer` header,
   * which ASP.NET writes before any action runs. Any other 401 may come from
   * inside the action (an in-action `Unauthorized(null)` is an empty 401
   * without that header; one with a body is One's `GeneralResponse` or a
   * `ProblemDetails`), which may already have filed or sent. Those are never
   * re-sent: the 401 is thrown as it is, and `isDefinitiveOneSystemsFailure`
   * treats it as unclear.
   *
   * Only SendDocToIslandIs may resolve without an `ItemID`.
   */
  private callAction(
    operation: Exclude<ActionOperation, 'SendDocToIslandIs'>,
    send: SendAction,
  ): Promise<ActionResponse<string>>
  private callAction(
    operation: 'SendDocToIslandIs',
    send: SendAction,
  ): Promise<ActionResponse<string | null>>
  private async callAction(
    operation: ActionOperation,
    send: SendAction,
  ): Promise<ActionResponse<string | null>> {
    const baseUrl = this.requireConfig(operation, 'ONESYSTEMS_API_URL')

    this.logger.info(`Calling OneSystems ${operation}`, this.meta(operation))

    let token = await this.getToken()
    let result = await send(actionRequestOptions(operation, baseUrl, token))

    if (
      result.response?.status === 401 &&
      NON_IDEMPOTENT_OPERATIONS.includes(operation) &&
      !isEmptyBearerChallenge(result.error)
    ) {
      this.logger.warn(
        `OneSystems ${operation} answered 401 without an empty Bearer challenge, which may come from its action handler, not retrying`,
        this.meta(operation),
      )
      // The token may still be good, but a fresh one costs only a Login.
      this.tokenCache.invalidate(token)
    } else if (result.response?.status === 401) {
      this.logger.warn(
        `OneSystems ${operation} rejected the token, logging in again and retrying once`,
        this.meta(operation),
      )
      this.tokenCache.invalidate(token)
      token = await this.getToken()
      result = await send(actionRequestOptions(operation, baseUrl, token))
    }

    const response = this.readActionResponse(operation, result)

    this.logger.info(`OneSystems ${operation} succeeded`, {
      ...this.meta(operation),
      itemId: response.itemId,
    })

    return response
  }

  private readActionResponse(
    operation: ActionOperation,
    { data, error, response }: SdkResult,
  ): ActionResponse<string | null> {
    this.assertResponded(operation, error, response)

    if (!response.ok) {
      // For a non-2xx the generated client hands back the body as `error`,
      // JSON-parsed when it could be.
      const generalResponse = asGeneralResponse(error)
      const validationProblem = isValidationProblemBody(error)
      const emptyBody = isEmptyErrorBody(error)
      const bearerChallenge = isEmptyBearerChallenge(error)
      const errorNumber = generalResponse
        ? errorCode(generalResponse.ErrorNumber)
        : null
      this.logger.error(`OneSystems ${operation} returned an HTTP error`, {
        ...this.meta(operation),
        status: response.status,
        hasGeneralResponseBody: generalResponse !== null,
        isValidationProblemBody: validationProblem,
        hasEmptyBody: emptyBody,
        hasBearerChallenge: bearerChallenge,
        errorNumber: toLoggableErrorNumber(errorNumber),
        bodyLength: emptyBody ? 0 : bodyLength(error),
      })
      throw new OneSystemsError(
        `OneSystems ${operation} failed with HTTP ${response.status}`,
        {
          operation,
          reason: 'HTTP',
          upstreamStatus: response.status,
          hasGeneralResponseBody: generalResponse !== null,
          isValidationProblemBody: validationProblem,
          hasEmptyBody: emptyBody,
          hasBearerChallenge: bearerChallenge,
          errorNumber,
          errorMessage: generalResponse
            ? nonEmptyString(generalResponse.ErrorMessage)
            : null,
        },
      )
    }

    const body = parseActionBody(data)
    if (!body || typeof body.Success !== 'boolean') {
      this.logger.error(
        `OneSystems ${operation} returned a response without a Success flag`,
        {
          ...this.meta(operation),
          status: response.status,
          bodyLength: bodyLength(data),
        },
      )
      throw new OneSystemsError(
        `OneSystems ${operation} returned an unrecognisable response`,
        {
          operation,
          reason: 'UNEXPECTED_RESPONSE',
          upstreamStatus: response.status,
        },
      )
    }

    if (!body.Success) {
      const errorNumber = errorCode(body.ErrorNumber)
      const shownErrorNumber = toLoggableErrorNumber(errorNumber)
      this.logger.error(`OneSystems ${operation} was rejected`, {
        ...this.meta(operation),
        status: response.status,
        errorNumber: shownErrorNumber,
      })
      throw new OneSystemsError(
        // Only a code-shaped ErrorNumber goes in the message, which callers
        // may log or store.
        `OneSystems ${operation} was rejected` +
          (shownErrorNumber ? ` (ErrorNumber ${shownErrorNumber})` : ''),
        {
          operation,
          reason: 'REJECTED',
          upstreamStatus: response.status,
          errorNumber,
          errorMessage: nonEmptyString(body.ErrorMessage),
        },
      )
    }

    const itemId = nonEmptyString(body.ItemID)
    if (!itemId && operation === 'SendDocToIslandIs') {
      // `ItemID` is nullable in the spec and what SendDocToIslandIs puts there
      // is undocumented. One said the send succeeded, so it counts as sent.
      this.logger.warn(
        `OneSystems ${operation} reported success without an ItemID, treating it as sent`,
        { ...this.meta(operation), status: response.status },
      )
      return { itemId: null, body }
    }
    if (!itemId) {
      // One reported success, so it may well have acted, but without the id
      // the result cannot be tracked. The outcome is unknown, not rejected.
      this.logger.error(
        `OneSystems ${operation} reported success without an ItemID`,
        { ...this.meta(operation), status: response.status },
      )
      throw new OneSystemsError(
        `OneSystems ${operation} reported success without an ItemID`,
        {
          operation,
          reason: 'UNEXPECTED_RESPONSE',
          upstreamStatus: response.status,
        },
      )
    }

    return { itemId, body }
  }

  private getToken(): Promise<string> {
    return this.tokenCache.get(() => this.login())
  }

  /**
   * Every Login failure is a `OneSystemsError`, so it is always definitive:
   * the action was never sent. Anything else thrown on the way is wrapped.
   */
  private async login(): Promise<OneSystemsToken> {
    try {
      return await this.sendLogin()
    } catch (error) {
      if (isOneSystemsError(error)) {
        throw error
      }
      this.logger.error('OneSystems Login failed unexpectedly', {
        ...this.meta('Login'),
        errorName: error instanceof Error ? error.name : undefined,
      })
      throw new OneSystemsError('OneSystems Login failed unexpectedly', {
        operation: 'Login',
        reason: 'TRANSPORT',
        cause: error,
      })
    }
  }

  /**
   * Login runs on its own client with no `auth`, and its body is read as text
   * because the response shape is undocumented. The body is never logged: in
   * an unexpected shape it could still be the token.
   */
  private async sendLogin(): Promise<OneSystemsToken> {
    const baseUrl = this.requireConfig('Login', 'ONESYSTEMS_API_URL')
    const userName = this.requireConfig('Login', 'ONESYSTEMS_USERNAME')
    const password = this.requireConfig('Login', 'ONESYSTEMS_PASSWORD')

    this.logger.info('Logging in to OneSystems', this.meta('Login'))

    const { data, error, response }: SdkResult = await postApiAuthLogin({
      client: oneSystemsLoginClient,
      baseUrl,
      parseAs: 'text',
      signal: AbortSignal.timeout(oneSystemsTimeoutMs('Login')),
      body: { UserName: userName, Password: password },
    })

    this.assertResponded('Login', error, response)

    if (!response.ok) {
      this.logger.error('OneSystems Login returned an HTTP error', {
        ...this.meta('Login'),
        status: response.status,
      })
      throw new OneSystemsError(
        `OneSystems Login failed with HTTP ${response.status}`,
        { operation: 'Login', reason: 'HTTP', upstreamStatus: response.status },
      )
    }

    const token = typeof data === 'string' ? parseLoginResponse(data) : null
    if (!token) {
      this.logger.error(
        'OneSystems Login response did not contain a recognisable token',
        {
          ...this.meta('Login'),
          status: response.status,
          bodyLength: typeof data === 'string' ? data.length : undefined,
        },
      )
      throw new OneSystemsError(
        'OneSystems Login returned an unrecognisable response',
        {
          operation: 'Login',
          reason: 'UNEXPECTED_RESPONSE',
          upstreamStatus: response.status,
        },
      )
    }

    this.logger.info('Logged in to OneSystems', {
      ...this.meta('Login'),
      expiresInSeconds: Math.round((token.expiresAt - Date.now()) / 1_000),
    })

    return token
  }

  /**
   * No response means the request failed in transit or timed out. An error
   * alongside a 2xx means the body could not be read. An `Error` alongside a
   * non-2xx means the same: for a non-2xx the generated client hands back the
   * body it read (JSON-parsed, or the text, or an interceptor's marker), and
   * only a failed read of that body, mid-stream, surfaces as an `Error`. What
   * such a response would have said is unknown, so it proves nothing about
   * whether the action ran, for any operation. The outcome is unknown, and so
   * is the body's length, which is not logged. Only the error's name and code
   * are logged: a parse error's message can quote the body.
   */
  private assertResponded(
    operation: OneSystemsOperation,
    error: unknown,
    response: Response | undefined,
  ): asserts response is Response {
    const unreadable = response?.ok
      ? error !== undefined
      : error instanceof Error
    if (response && !unreadable) {
      return
    }
    this.logger.error(
      `OneSystems ${operation} request got no usable response`,
      {
        ...this.meta(operation),
        status: response?.status,
        errorName: error instanceof Error ? error.name : undefined,
        errorCode: transportErrorCode(error),
      },
    )
    throw new OneSystemsError(
      `OneSystems ${operation} got no usable response`,
      {
        operation,
        reason: 'TRANSPORT',
        upstreamStatus: response?.status,
        cause: error instanceof Error ? error : undefined,
      },
    )
  }

  private requireConfig(
    operation: OneSystemsOperation,
    name: ConfigVariable,
  ): string {
    const value =
      name === 'ONESYSTEMS_API_URL'
        ? resolveOneSystemsBaseUrl()
        : process.env[name]
    if (value) {
      return value
    }
    this.logger.error(
      `OneSystems is not configured: ${name} is not set`,
      this.meta(operation),
    )
    throw new OneSystemsError(
      `OneSystems is not configured: ${name} is not set`,
      { operation, reason: 'CONFIG' },
    )
  }

  /** The value is never put in the message or the log, only the field name. */
  private requireText(
    operation: ActionOperation,
    field: string,
    value: unknown,
  ): string {
    if (typeof value === 'string' && value.trim() !== '') {
      return value
    }
    throw this.invalidInput(operation, `${field} must be a non-empty string`)
  }

  private requireFile(operation: ActionOperation, file: unknown): Buffer {
    if (Buffer.isBuffer(file) && file.length > 0) {
      return file
    }
    throw this.invalidInput(operation, 'file must be a non-empty Buffer')
  }

  private requireDate(operation: ActionOperation, date: unknown): Date {
    if (date === undefined) {
      return new Date()
    }
    if (date instanceof Date && Number.isFinite(date.getTime())) {
      return date
    }
    throw this.invalidInput(operation, 'createDate must be a valid Date')
  }

  private invalidInput(
    operation: ActionOperation,
    problem: string,
  ): OneSystemsError {
    this.logger.error(
      `OneSystems ${operation} input is invalid: ${problem}`,
      this.meta(operation),
    )
    return new OneSystemsError(
      `OneSystems ${operation} input is invalid: ${problem}`,
      { operation, reason: 'INVALID_INPUT' },
    )
  }

  private meta(operation: OneSystemsOperation) {
    return {
      category: LOGGING_CATEGORY,
      context: LOGGING_CONTEXT,
      operation,
    }
  }
}

/**
 * Options shared by every action request. A new timeout signal is made per
 * request, so the retry after a 401 gets its own full timeout.
 */
function actionRequestOptions(
  operation: ActionOperation,
  baseUrl: string,
  token: string,
) {
  return {
    client: oneSystemsActionClient,
    baseUrl,
    auth: token,
    // Read as text and parse here: One may answer with `text/plain` or no
    // Content-Type at all, which `auto` would not parse as JSON.
    parseAs: 'text' as const,
    signal: AbortSignal.timeout(oneSystemsTimeoutMs(operation)),
  }
}

function parseActionBody(data: unknown): Record<string, unknown> | null {
  let value = data
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value)
    } catch {
      return null
    }
  }
  return isRecord(value) ? value : null
}

/**
 * One's `GeneralResponse` is recognised by a boolean `Success`. ASP.NET's
 * model-validation `ProblemDetails` (`type`, `title`, `status`, `errors`)
 * has none.
 */
function asGeneralResponse(value: unknown): Record<string, unknown> | null {
  const body = parseActionBody(value)
  return body && typeof body.Success === 'boolean' ? body : null
}

/**
 * ASP.NET's automatic model-validation response, `ValidationProblemDetails`,
 * is recognised by an `errors` object (ASP.NET always serialises the
 * `ProblemDetails` members in camelCase). A plain `ProblemDetails` has no
 * `errors`: under `[ApiController]` that is what a bare `BadRequest()` from
 * inside an action becomes, so it must not be taken as "never reached the
 * action".
 */
function isValidationProblemBody(value: unknown): boolean {
  const body = parseActionBody(value)
  return (
    body !== null && typeof body.Success !== 'boolean' && isRecord(body.errors)
  )
}

/**
 * True when a non-2xx body was empty or whitespace only. The action client's
 * error interceptor turns exactly those bodies into
 * {@link ONESYSTEMS_EMPTY_ERROR_BODY} or
 * {@link ONESYSTEMS_EMPTY_BEARER_CHALLENGE_BODY}; see `onesystems.config.ts`.
 */
function isEmptyErrorBody(value: unknown): boolean {
  return (
    value === ONESYSTEMS_EMPTY_ERROR_BODY ||
    value === ONESYSTEMS_EMPTY_BEARER_CHALLENGE_BODY
  )
}

/**
 * True for the JwtBearer challenge: a 401 whose body was empty and whose
 * `WWW-Authenticate` names the Bearer scheme. The interceptor sets
 * {@link ONESYSTEMS_EMPTY_BEARER_CHALLENGE_BODY} only for that.
 */
function isEmptyBearerChallenge(value: unknown): boolean {
  return value === ONESYSTEMS_EMPTY_BEARER_CHALLENGE_BODY
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null
}

/**
 * `ErrorNumber` is a string in the spec; accept a number too, as its string.
 * Either way the result is raw: it is logged or stored only through
 * `toLoggableErrorNumber`, which withholds a kennitala-shaped number too.
 */
function errorCode(value: unknown): string | null {
  return typeof value === 'number' ? String(value) : nonEmptyString(value)
}

/** The length of a body as the generated client handed it back. */
function bodyLength(body: unknown): number | undefined {
  if (body === undefined || body === null) {
    return undefined
  }
  if (typeof body === 'string') {
    return body.length
  }
  try {
    return JSON.stringify(body).length
  } catch {
    return undefined
  }
}

/**
 * Node's error codes (`ECONNREFUSED`, `UND_ERR_SOCKET`,
 * `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, ...) are upper-case constants, some
 * longer than One's `ErrorNumber` filter allows.
 */
const NODE_ERROR_CODE = /^[A-Z0-9_]{1,64}$/

/** A Node network error's code, from it or its cause. */
function transportErrorCode(error: unknown): string | undefined {
  for (const candidate of [error, (error as { cause?: unknown })?.cause]) {
    const code = (candidate as { code?: unknown } | undefined)?.code
    if (
      typeof code === 'string' &&
      NODE_ERROR_CODE.test(code) &&
      hasNoKennitalaShape(code)
    ) {
      return code
    }
  }
  return undefined
}

import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'

import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import {
  postApiActionsCloseCase,
  postApiActionsCreateCase,
  postApiActionsCreateDocument,
  postApiActionsSendDocToIslandIs,
  postApiAuthLogin,
} from '../gen/fetch'
import {
  ONESYSTEMS_REQUEST_TIMEOUT_MS,
  oneSystemsActionClient,
  oneSystemsLoginClient,
  resolveOneSystemsBaseUrl,
} from './onesystems.config'
import { OneSystemsError, type OneSystemsOperation } from './onesystems.errors'
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

/** How much of a non-2xx action response body to log. */
const MAX_LOGGED_ERROR_BODY = 500

type ActionOperation = Exclude<OneSystemsOperation, 'Login'>

/** What every generated SDK function resolves to when it does not throw. */
interface SdkResult {
  data?: unknown
  error?: unknown
  response?: Response
}

/** A 2xx action response with `Success: true` and an `ItemID`. */
interface ActionResponse {
  itemId: string
  body: Record<string, unknown>
}

/**
 * Calls OneExternalAPI (OneSystems' API for Jafnréttisstofa's One case system).
 *
 * Environment, read when a call is made and never at import:
 * - `ONESYSTEMS_API_URL`: optional base URL override
 * - `ONESYSTEMS_USERNAME`, `ONESYSTEMS_PASSWORD`: Login credentials
 *
 * Neither the token nor the password is ever logged, and neither is a
 * kennitala or the document bytes.
 */
@Injectable()
export class OneSystemsService implements IOneSystemsService {
  private readonly tokenCache = new OneSystemsTokenCache()

  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {}

  async createCase(
    input: OneSystemsCreateCaseInput,
  ): Promise<OneSystemsCreateCaseResult> {
    const { itemId, body } = await this.callAction('CreateCase', (common) =>
      postApiActionsCreateCase({
        ...common,
        body: {
          IDNumber: input.nationalId,
          CustomerName: input.customerName,
          CaseType: input.caseType,
          Portal: input.portal,
        },
      }),
    )
    return {
      caseItemId: itemId,
      caseNumber: nonEmptyString(body.CaseNumber),
    }
  }

  async createDocument(
    input: OneSystemsCreateDocumentInput,
  ): Promise<OneSystemsCreateDocumentResult> {
    const { itemId } = await this.callAction('CreateDocument', (common) =>
      postApiActionsCreateDocument({
        ...common,
        body: {
          ParentID: input.caseItemId,
          Subject: input.subject,
          Extension: input.extension ?? DEFAULT_EXTENSION,
          CreateDate: (input.createDate ?? new Date()).toISOString(),
          Author: input.author,
          DocCategory: input.docCategory,
          DocType: input.docType,
          File: input.file.toString('base64'),
          Portal: input.portal,
        },
      }),
    )
    return { documentItemId: itemId }
  }

  async sendDocToIslandIs(
    input: OneSystemsSendDocToIslandIsInput,
  ): Promise<OneSystemsSendDocToIslandIsResult> {
    const { itemId } = await this.callAction('SendDocToIslandIs', (common) =>
      postApiActionsSendDocToIslandIs({
        ...common,
        body: {
          ItemID: input.documentItemId,
          IDNumber: input.nationalId,
          Category: input.category,
          Type: input.type,
          SendNotification: input.sendNotification,
        },
      }),
    )
    return { islandIsDocumentId: itemId }
  }

  async closeCase(
    input: OneSystemsCloseCaseInput,
  ): Promise<OneSystemsCloseCaseResult> {
    const { itemId } = await this.callAction('CloseCase', (common) =>
      postApiActionsCloseCase({
        ...common,
        body: {
          CaseID: input.caseId,
          StatusName: input.statusName ?? DEFAULT_CLOSE_STATUS,
        },
      }),
    )
    return { caseItemId: itemId }
  }

  /**
   * Sends one action with the current token. A 401 means the token was not
   * accepted and the action was not handled, so the token is dropped and the
   * action is sent once more with a fresh one. A second 401 is thrown.
   */
  private async callAction(
    operation: ActionOperation,
    send: (
      common: ReturnType<typeof actionRequestOptions>,
    ) => Promise<SdkResult>,
  ): Promise<ActionResponse> {
    this.logger.info(`Calling OneSystems ${operation}`, this.meta(operation))

    let token = await this.getToken()
    let result = await send(actionRequestOptions(token))

    if (result.response?.status === 401) {
      this.logger.warn(
        `OneSystems ${operation} rejected the token, logging in again and retrying once`,
        this.meta(operation),
      )
      this.tokenCache.invalidate(token)
      token = await this.getToken()
      result = await send(actionRequestOptions(token))
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
  ): ActionResponse {
    this.assertResponded(operation, error, response)

    if (!response.ok) {
      this.logger.error(`OneSystems ${operation} returned an HTTP error`, {
        ...this.meta(operation),
        status: response.status,
        errorBody: truncatedErrorBody(error),
      })
      throw new OneSystemsError(
        `OneSystems ${operation} failed with HTTP ${response.status}`,
        { operation, reason: 'HTTP', upstreamStatus: response.status },
      )
    }

    const body = parseActionBody(data)
    if (!body || typeof body.Success !== 'boolean') {
      this.logger.error(
        `OneSystems ${operation} returned a response without a Success flag`,
        { ...this.meta(operation), status: response.status },
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
      const errorMessage = nonEmptyString(body.ErrorMessage)
      this.logger.error(`OneSystems ${operation} was rejected`, {
        ...this.meta(operation),
        errorNumber,
        errorMessage,
      })
      throw new OneSystemsError(
        `OneSystems ${operation} was rejected` +
          (errorNumber ? ` (ErrorNumber ${errorNumber})` : ''),
        {
          operation,
          reason: 'REJECTED',
          upstreamStatus: response.status,
          errorNumber,
          errorMessage,
        },
      )
    }

    const itemId = nonEmptyString(body.ItemID)
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
   * Login runs on its own client with no `auth`, and its body is read as text
   * because the response shape is undocumented. The body is never logged: in
   * an unexpected shape it could still be the token.
   */
  private async login(): Promise<OneSystemsToken> {
    const userName = this.requireEnv('ONESYSTEMS_USERNAME')
    const password = this.requireEnv('ONESYSTEMS_PASSWORD')

    this.logger.info('Logging in to OneSystems', this.meta('Login'))

    const { data, error, response }: SdkResult = await postApiAuthLogin({
      client: oneSystemsLoginClient,
      baseUrl: resolveOneSystemsBaseUrl(),
      parseAs: 'text',
      signal: AbortSignal.timeout(ONESYSTEMS_REQUEST_TIMEOUT_MS),
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
   * alongside a 2xx means the body could not be read. Either way the outcome
   * is unknown.
   */
  private assertResponded(
    operation: OneSystemsOperation,
    error: unknown,
    response: Response | undefined,
  ): asserts response is Response {
    if (response && !(response.ok && error !== undefined)) {
      return
    }
    this.logger.error(
      `OneSystems ${operation} request got no usable response`,
      {
        ...this.meta(operation),
        status: response?.status,
        errorName: error instanceof Error ? error.name : undefined,
        errorMessage: error instanceof Error ? error.message : undefined,
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

  private requireEnv(name: string): string {
    const value = process.env[name]
    if (!value) {
      this.logger.error(`Missing required environment variable: ${name}`, {
        category: LOGGING_CATEGORY,
        context: LOGGING_CONTEXT,
      })
      throw new InternalServerErrorException(
        `Missing required environment variable: ${name}`,
      )
    }
    return value
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
 * request, so the retry after a 401 gets its own 30s.
 */
function actionRequestOptions(token: string) {
  return {
    client: oneSystemsActionClient,
    baseUrl: resolveOneSystemsBaseUrl(),
    auth: token,
    // Read as text and parse here: One may answer with `text/plain` or no
    // Content-Type at all, which `auto` would not parse as JSON.
    parseAs: 'text' as const,
    signal: AbortSignal.timeout(ONESYSTEMS_REQUEST_TIMEOUT_MS),
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
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null
}

/** `ErrorNumber` is a string in the spec; accept a number too. */
function errorCode(value: unknown): string | null {
  return typeof value === 'number' ? String(value) : nonEmptyString(value)
}

function truncatedErrorBody(error: unknown): string | undefined {
  if (error === undefined) {
    return undefined
  }
  const text = typeof error === 'string' ? error : JSON.stringify(error)
  return text.length > MAX_LOGGED_ERROR_BODY
    ? `${text.slice(0, MAX_LOGGED_ERROR_BODY)}...`
    : text
}

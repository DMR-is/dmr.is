import { inspect } from 'node:util'

import { BadGatewayException } from '@nestjs/common'

/** The OneExternalAPI call that failed. */
export type OneSystemsOperation =
  | 'Login'
  | 'CreateCase'
  | 'CreateDocument'
  | 'SendDocToIslandIs'
  | 'CloseCase'

/**
 * Why a OneExternalAPI call failed.
 *
 * - `CONFIG`: `ONESYSTEMS_API_URL`, `ONESYSTEMS_USERNAME` or
 *   `ONESYSTEMS_PASSWORD` is not set. Thrown before any request is sent.
 * - `INVALID_INPUT`: the caller's input cannot be sent (an empty required
 *   field, an empty file, an invalid `createDate`). Thrown before any request
 *   is sent, including Login.
 * - `REJECTED`: One answered 200 with `Success: false`. `errorNumber` and
 *   `errorMessage` carry One's own explanation. What One did before rejecting
 *   is undocumented; see {@link isDefinitiveOneSystemsFailure}.
 * - `HTTP`: One (or something in front of it) answered with a non-2xx status,
 *   carried in `upstreamStatus`. `hasGeneralResponseBody` says whether the
 *   body was One's own `GeneralResponse` (which means the request reached
 *   One's action handler). `isValidationProblemBody` says whether it was
 *   ASP.NET's automatic model-validation `ValidationProblemDetails` (which
 *   means it did not). `hasEmptyBody` says whether there was no body at all
 *   (or only whitespace), and `hasBearerChallenge` whether an empty 401 also
 *   carried a `WWW-Authenticate: Bearer` challenge, which is how ASP.NET's
 *   JwtBearer handler rejects a token before the action. An empty body alone
 *   proves nothing (see {@link isDefinitiveOneSystemsFailure}), and neither
 *   does any other body (plain text, HTML, a bare `ProblemDetails`).
 * - `TRANSPORT`: no usable response: a network error, a DNS or TLS failure,
 *   the request timeout, or a response whose body could not be read (then
 *   `upstreamStatus` is set). One may or may not have acted on the call.
 * - `UNEXPECTED_RESPONSE`: a 2xx arrived but could not be trusted: the body was
 *   not a recognisable response, `Success` was missing, or `Success: true` came
 *   without the `ItemID` the call exists to produce. One may well have acted
 *   (a document may have been created) but we did not learn its id, so the
 *   outcome is unknown. For Login it means no token could be read from the
 *   response.
 */
export type OneSystemsErrorReason =
  | 'CONFIG'
  | 'INVALID_INPUT'
  | 'REJECTED'
  | 'HTTP'
  | 'TRANSPORT'
  | 'UNEXPECTED_RESPONSE'

export interface OneSystemsErrorDetails {
  operation: OneSystemsOperation
  reason: OneSystemsErrorReason
  /** One's HTTP status, when a response arrived. */
  upstreamStatus?: number
  /**
   * For `HTTP`: true when the non-2xx body was a One `GeneralResponse` (an
   * object with a boolean `Success`).
   */
  hasGeneralResponseBody?: boolean
  /**
   * For `HTTP`: true when the non-2xx body was ASP.NET's
   * `ValidationProblemDetails`: a JSON object with an `errors` object and no
   * boolean `Success`. Only automatic model validation, which runs before the
   * action, produces it; a bare `BadRequest()` returned from inside an action
   * becomes a `ProblemDetails` WITHOUT `errors`.
   */
  isValidationProblemBody?: boolean
  /**
   * For `HTTP`: true when the non-2xx response had no body at all, or only
   * whitespace. ASP.NET's own pipeline rejections (the JwtBearer challenge, an
   * authorization failure, no matching route) answer that way, but so can an
   * action: `NotFound(null)` and `Unauthorized(null)` keep their status with
   * an empty body, and `Forbid()` / `Challenge()` go through the auth handler,
   * which writes an empty 403 / 401. On its own it proves nothing.
   */
  hasEmptyBody?: boolean
  /**
   * For `HTTP`: true when the response was a 401 with an empty body AND a
   * `WWW-Authenticate` header whose scheme is Bearer. The JwtBearer challenge
   * always sets that header; an in-action `Unauthorized(null)` does not.
   */
  hasBearerChallenge?: boolean
  /** One's `ErrorNumber`, when its response carried one. */
  errorNumber?: string | null
  /** One's `ErrorMessage`, when its response carried one. Never logged. */
  errorMessage?: string | null
  cause?: unknown
}

/** What {@link OneSystemsError.toJSON} returns: only fields safe to log. */
export interface OneSystemsErrorJson {
  name: string
  message: string
  operation: OneSystemsOperation
  reason: OneSystemsErrorReason
  upstreamStatus?: number
  hasGeneralResponseBody: boolean
  isValidationProblemBody: boolean
  hasEmptyBody: boolean
  hasBearerChallenge: boolean
  /** Passed through {@link toLoggableErrorNumber}. */
  errorNumber?: string
}

/**
 * Thrown by the OneSystems client for every failed OneExternalAPI call. It is a
 * 502 so an uncaught one surfaces as an upstream failure. The exception message
 * (and so `getResponse()`) is written by us and never includes One's
 * `ErrorMessage`, a response body, any input value or a raw `ErrorNumber` (all
 * of which may contain a kennitala or a name); read `errorMessage` for One's
 * text, and never log it.
 *
 * The exception filters log the whole exception object, so `errorMessage`,
 * `errorNumber` and `cause` are non-enumerable (as is `HttpException`'s own
 * `options`, which holds the cause too): the logger's PII masking and object
 * spread skip them, `toJSON()` returns only {@link OneSystemsErrorJson}, and
 * `util.inspect` prints the same fields plus the cause's name only (a cause's
 * message, such as a parse error's, can quote a response body). They stay
 * readable as properties.
 */
export class OneSystemsError extends BadGatewayException {
  readonly operation: OneSystemsOperation
  readonly reason: OneSystemsErrorReason
  /**
   * One's HTTP status, when a response arrived. (Not `status`: that is
   * `HttpException`'s own private field and is always 502 here.)
   */
  readonly upstreamStatus?: number
  readonly hasGeneralResponseBody: boolean
  readonly isValidationProblemBody: boolean
  readonly hasEmptyBody: boolean
  readonly hasBearerChallenge: boolean
  /**
   * One's raw `ErrorNumber`. Non-enumerable; log it only through
   * {@link toLoggableErrorNumber}.
   */
  declare readonly errorNumber: string | null
  /** One's raw `ErrorMessage`. Non-enumerable; never log it. */
  declare readonly errorMessage: string | null

  constructor(message: string, details: OneSystemsErrorDetails) {
    super(message, { cause: details.cause })
    this.name = 'OneSystemsError'
    this.operation = details.operation
    this.reason = details.reason
    this.upstreamStatus = details.upstreamStatus
    this.hasGeneralResponseBody = details.hasGeneralResponseBody ?? false
    this.isValidationProblemBody = details.isValidationProblemBody ?? false
    this.hasEmptyBody = details.hasEmptyBody ?? false
    this.hasBearerChallenge = details.hasBearerChallenge ?? false
    // `HttpException` assigns both as ordinary (enumerable) fields, so an
    // object spread or a logger walking own keys would reach the cause's
    // message. Keep them readable, but hide them.
    hideOwnProperty(this, 'cause')
    hideOwnProperty(this, 'options')
    Object.defineProperty(this, 'errorNumber', {
      value: details.errorNumber ?? null,
      enumerable: false,
      writable: false,
      configurable: false,
    })
    Object.defineProperty(this, 'errorMessage', {
      value: details.errorMessage ?? null,
      enumerable: false,
      writable: false,
      configurable: false,
    })
  }

  toJSON(): OneSystemsErrorJson {
    return {
      name: this.name,
      message: this.message,
      operation: this.operation,
      reason: this.reason,
      upstreamStatus: this.upstreamStatus,
      hasGeneralResponseBody: this.hasGeneralResponseBody,
      isValidationProblemBody: this.isValidationProblemBody,
      hasEmptyBody: this.hasEmptyBody,
      hasBearerChallenge: this.hasBearerChallenge,
      errorNumber: toLoggableErrorNumber(this.errorNumber),
    }
  }

  [inspect.custom](): string {
    const { name, message, ...fields } = this.toJSON()
    const causeName =
      this.cause instanceof Error
        ? this.cause.name
        : this.cause === undefined
          ? undefined
          : typeof this.cause
    // The stack's first line is `name: message`, which we wrote.
    const head = this.stack ?? `${name}: ${message}`
    return `${head} ${inspect({ ...fields, causeName })}`
  }
}

/** Makes an own property non-enumerable, keeping its value. */
function hideOwnProperty(target: object, key: string): void {
  const descriptor = Object.getOwnPropertyDescriptor(target, key)
  if (descriptor) {
    Object.defineProperty(target, key, { ...descriptor, enumerable: false })
  }
}

export function isOneSystemsError(error: unknown): error is OneSystemsError {
  return error instanceof OneSystemsError
}

/** The operations that file or deliver a document and must never repeat. */
export type OneSystemsNonIdempotentOperation =
  | 'CreateDocument'
  | 'SendDocToIslandIs'

/**
 * One `ErrorNumber`s that are known to be raised BEFORE a document is filed
 * (CreateDocument) or sent to island.is (SendDocToIslandIs). An error carrying
 * one of these is definitive for that operation whatever its reason or status.
 *
 * TODO(OneSystems): empty on purpose. The spec has no `ErrorNumber` catalogue,
 * and One calls island.is itself inside SendDocToIslandIs, so a
 * `Success: false` may come back after island.is registered the document.
 * OneSystems must confirm which error numbers are raised before a document is
 * filed or sent; add only those, per operation.
 */
export const ONESYSTEMS_PREFLIGHT_ERROR_NUMBERS: Readonly<
  Record<OneSystemsNonIdempotentOperation, ReadonlyArray<string>>
> = Object.freeze({
  CreateDocument: Object.freeze([]),
  SendDocToIslandIs: Object.freeze([]),
})

/**
 * TODO(OneSystems): can any One action, AFTER it has filed/sent, return
 * `NotFound(null)`, `Unauthorized(null)`, `Forbid()`, `Challenge()` or
 * `ValidationProblem()`? Is the 401 challenge body empty, and does it carry
 * `WWW-Authenticate: Bearer`?
 *
 * The rule below assumes: no, and yes. `Challenge()` from inside an action
 * would produce exactly the empty Bearer-challenged 401 treated as definitive
 * (and retried) here, and nothing client-side can tell it apart from a real
 * auth failure, so only OneSystems can rule it out. If the challenge turns out
 * not to carry the header, every expired token on CreateDocument or
 * SendDocToIslandIs ends UNCERTAIN (never a duplicate).
 */
/**
 * True when One certainly did NOT act on the action call, so repeating it
 * cannot create a duplicate. False when the outcome is unknown, and for any
 * error that is not a `OneSystemsError`.
 *
 * Always definitive:
 * - `CONFIG` and `INVALID_INPUT`: nothing was sent.
 * - any failure of `Login`: the action call was never sent.
 *
 * `CreateCase` and `CloseCase` (find-or-create and a status change, so a
 * repeat is not expected to duplicate anything):
 * - definitive: `REJECTED`, and `HTTP` with a 4xx status, with or without a
 *   body (this includes a 401 that persisted after the one token refresh);
 * - not definitive: `TRANSPORT` (including a response whose body could not be
 *   read), `HTTP` with a 5xx (or no) status, and `UNEXPECTED_RESPONSE`.
 *
 * `CreateDocument` and `SendDocToIslandIs` (not idempotent: a wrong "definitive"
 * files or delivers a statutory notice twice), definitive only when the
 * request never reached the action:
 * - (a) `HTTP` 401 with an EMPTY body (whitespace only counts as empty) AND a
 *   `WWW-Authenticate` header whose scheme is Bearer (`hasBearerChallenge`):
 *   the JwtBearer challenge, which always sets that header. An in-action
 *   `Unauthorized(null)` is an empty 401 without it, so an empty body alone
 *   is not enough;
 * - (b) `HTTP` 400 whose body is ASP.NET's `ValidationProblemDetails`
 *   (automatic model validation, which runs before the action).
 *
 * Nothing else is, unless its `errorNumber` is in
 * {@link ONESYSTEMS_PREFLIGHT_ERROR_NUMBERS} for that operation:
 * - an empty 403 or 404 is not: `Forbid()` from inside an action goes through
 *   the auth handler and is an empty 403, and `NotFound(null)` is an empty
 *   404. A wrong base URL or a missing permission is already caught,
 *   definitively, at CreateCase, which is idempotent and runs first;
 * - a 401, 403 or 404 with any body, a `GeneralResponse` or a
 *   `ProblemDetails`, may have come from inside the action;
 * - a 400 with any other body (empty, plain text, HTML, a `ProblemDetails`
 *   without `errors`): an action can return `BadRequest(...)` after One has
 *   already called island.is;
 * - `REJECTED`, other 4xx, 5xx, `TRANSPORT` (including an unreadable error
 *   body) and `UNEXPECTED_RESPONSE`.
 */
export function isDefinitiveOneSystemsFailure(error: unknown): boolean {
  return isDefinitiveOneSystemsFailureGiven(
    error,
    ONESYSTEMS_PREFLIGHT_ERROR_NUMBERS,
  )
}

/**
 * {@link isDefinitiveOneSystemsFailure} with the pre-flight allowlist passed
 * in. Exists so the allowlist rule can be tested while the real list is
 * empty; not exported from the package.
 */
export function isDefinitiveOneSystemsFailureGiven(
  error: unknown,
  preflightErrorNumbers: Readonly<
    Record<OneSystemsNonIdempotentOperation, ReadonlyArray<string>>
  >,
): boolean {
  if (!isOneSystemsError(error)) {
    return false
  }
  if (error.reason === 'CONFIG' || error.reason === 'INVALID_INPUT') {
    return true
  }

  switch (error.operation) {
    case 'Login':
      return true
    case 'CreateCase':
    case 'CloseCase':
      return (
        error.reason === 'REJECTED' ||
        (error.reason === 'HTTP' && isClientErrorStatus(error.upstreamStatus))
      )
    case 'CreateDocument':
    case 'SendDocToIslandIs': {
      if (error.reason === 'HTTP' && neverReachedAction(error)) {
        return true
      }
      return (
        error.errorNumber !== null &&
        preflightErrorNumbers[error.operation].includes(error.errorNumber)
      )
    }
    default:
      return false
  }
}

/** Rules (a) and (b) of {@link isDefinitiveOneSystemsFailure}. */
function neverReachedAction(error: OneSystemsError): boolean {
  if (error.upstreamStatus === 401) {
    return error.hasEmptyBody && error.hasBearerChallenge
  }
  return error.upstreamStatus === 400 && error.isValidationProblemBody
}

function isClientErrorStatus(status: number | undefined): boolean {
  return status !== undefined && status >= 400 && status < 500
}

/**
 * A One `ErrorNumber` is loggable only when it looks like a code. Anything
 * else might be free text echoing input.
 */
const LOGGABLE_ERROR_NUMBER = /^[A-Za-z0-9._-]{1,32}$/

/**
 * Anything that could hold a kennitala, anywhere in the value: a run of nine
 * or more digits, or six digits, an optional hyphen and four digits. Withheld
 * even inside a code-shaped value (`E0101302989`, `0101302989_1`,
 * `010130-2989x`).
 */
const KENNITALA_SHAPED = /\d{9,}|\d{6}-?\d{4}/

/** True when `value` contains nothing that could be a kennitala. */
export function hasNoKennitalaShape(value: string): boolean {
  return !KENNITALA_SHAPED.test(value)
}

/** What {@link toLoggableErrorNumber} logs in place of a withheld value. */
export const WITHHELD_ERROR_NUMBER = '[not a code, withheld]'

/** True when `value` is code-shaped and contains nothing kennitala-shaped. */
export function isLoggableCode(value: string): boolean {
  return LOGGABLE_ERROR_NUMBER.test(value) && hasNoKennitalaShape(value)
}

/**
 * The form of One's `ErrorNumber` that may go in a log line: the value itself
 * when it is code-shaped, {@link WITHHELD_ERROR_NUMBER} when it is anything
 * else, and `undefined` when there is none. Every log line, and every stored
 * copy, of an `errorNumber`, in this client or a consumer, must pass it
 * through here; the raw value stays on the error object only.
 */
export function toLoggableErrorNumber(
  value: string | null | undefined,
): string | undefined {
  if (value === null || value === undefined) {
    return undefined
  }
  return isLoggableCode(value) ? value : WITHHELD_ERROR_NUMBER
}

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
 * - `REJECTED`: One answered 200 with `Success: false`. `errorNumber` and
 *   `errorMessage` carry One's own explanation. One did not act on the call.
 * - `HTTP`: One (or something in front of it) answered with a non-2xx status,
 *   carried in `upstreamStatus`. A 4xx means the request was refused before
 *   it was handled; a 5xx leaves the outcome unknown.
 * - `TRANSPORT`: no response arrived at all: a network error, a DNS or TLS
 *   failure, or the 30s timeout. One may or may not have acted on the call.
 * - `UNEXPECTED_RESPONSE`: a 2xx arrived but could not be trusted: the body was
 *   not a recognisable response, `Success` was missing, or `Success: true` came
 *   without the `ItemID` the call exists to produce. One may well have acted
 *   (a document may have been created) but we did not learn its id, so the
 *   outcome is unknown. For Login it means no token could be read from the
 *   response.
 */
export type OneSystemsErrorReason =
  | 'REJECTED'
  | 'HTTP'
  | 'TRANSPORT'
  | 'UNEXPECTED_RESPONSE'

export interface OneSystemsErrorDetails {
  operation: OneSystemsOperation
  reason: OneSystemsErrorReason
  /** One's HTTP status, when a response arrived. */
  upstreamStatus?: number
  /** One's `ErrorNumber`, when it rejected the call. */
  errorNumber?: string | null
  /** One's `ErrorMessage`, when it rejected the call. */
  errorMessage?: string | null
  cause?: unknown
}

/**
 * Thrown by the OneSystems client for every failed OneExternalAPI call. It is a
 * 502 so an uncaught one surfaces as an upstream failure. The exception message
 * is written by us and never includes One's `ErrorMessage` (which may echo
 * input); read `errorMessage` for that.
 */
export class OneSystemsError extends BadGatewayException {
  readonly operation: OneSystemsOperation
  readonly reason: OneSystemsErrorReason
  /**
   * One's HTTP status, when a response arrived. (Not `status`: that is
   * `HttpException`'s own private field and is always 502 here.)
   */
  readonly upstreamStatus?: number
  readonly errorNumber: string | null
  readonly errorMessage: string | null

  constructor(message: string, details: OneSystemsErrorDetails) {
    super(message, { cause: details.cause })
    this.name = 'OneSystemsError'
    this.operation = details.operation
    this.reason = details.reason
    this.upstreamStatus = details.upstreamStatus
    this.errorNumber = details.errorNumber ?? null
    this.errorMessage = details.errorMessage ?? null
  }
}

export function isOneSystemsError(error: unknown): error is OneSystemsError {
  return error instanceof OneSystemsError
}

/**
 * True when One certainly did NOT act on the action call, so repeating it
 * cannot create a duplicate. False when the outcome is unknown, and for any
 * error that is not a `OneSystemsError`.
 *
 * Definitive:
 * - `REJECTED`: One said `Success: false`.
 * - `HTTP` with a 4xx status: refused before being handled (this includes a
 *   401 that persisted after the one token refresh).
 * - any failure of `Login`: the action call was never sent.
 *
 * Not definitive: `TRANSPORT`, `HTTP` with a 5xx (or no) status, and
 * `UNEXPECTED_RESPONSE`.
 */
export function isDefinitiveOneSystemsFailure(error: unknown): boolean {
  if (!isOneSystemsError(error)) {
    return false
  }
  if (error.operation === 'Login') {
    return true
  }
  switch (error.reason) {
    case 'REJECTED':
      return true
    case 'HTTP':
      return (
        error.upstreamStatus !== undefined &&
        error.upstreamStatus >= 400 &&
        error.upstreamStatus < 500
      )
    default:
      return false
  }
}

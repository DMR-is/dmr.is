export type WithholdingTaxOperation = 'token' | 'getJobCount'

export type WithholdingTaxErrorReason =
  /** A base URL, username or password is missing from the environment. */
  | 'NOT_CONFIGURED'
  /** `/token` rejected the credentials, or a fresh token was still refused. */
  | 'AUTH_FAILED'
  /** Any other non-2xx status. */
  | 'HTTP_ERROR'
  /** A 2xx whose body does not match the documented shape. */
  | 'INVALID_RESPONSE'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'

/**
 * Every failure from this client. The message never contains a credential, a
 * token or a response body, so it is safe to log as-is.
 */
export class WithholdingTaxError extends Error {
  override readonly name = 'WithholdingTaxError'

  constructor(
    readonly reason: WithholdingTaxErrorReason,
    readonly operation: WithholdingTaxOperation,
    message: string,
    readonly status?: number,
  ) {
    super(message)
  }
}

export function isWithholdingTaxError(
  error: unknown,
): error is WithholdingTaxError {
  return error instanceof WithholdingTaxError
}

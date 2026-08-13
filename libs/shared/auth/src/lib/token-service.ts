import { decodeJwt } from 'jose'
import { JWT } from 'next-auth/jwt'
import { getLogger } from '@dmr.is/logging-next'

import { identityServerConfig } from './identityServerConfig'

const LOGGING_CATEGORY = 'refreshAccessToken'

const renewalSeconds = 20 // seconds

/**
 * The only OAuth error that proves the refresh token itself can no longer be
 * used, and therefore the only one that justifies ending the session.
 *
 * Everything else — `invalid_client` from a rotated secret, `invalid_request`
 * from a malformed call, any 5xx — says something about us or about IDS, not
 * about this user's refresh token. Ending sessions on those kills the whole
 * fleet over a config mistake while every refresh token is still perfectly
 * valid. They are transient here, bounded by the consecutive-failure ceiling in
 * `refresh-single-flight` so a permanent misconfiguration still eventually
 * prompts re-authentication instead of retrying forever.
 */
const TERMINAL_OAUTH_ERRORS = new Set(['invalid_grant'])

/**
 * Ceiling on a single `/connect/token` call, covering the body read as well as
 * the response headers.
 *
 * `fetch` has no timeout of its own, and concurrent refreshes are collapsed into
 * one shared call (see `refresh-single-flight`) — so a request that hangs while
 * streaming its body would hang every request waiting on it, not just its own.
 */
export const REFRESH_TIMEOUT_MS = 10 * 1000

/**
 * Signals a refresh that failed for a reason unrelated to the refresh token
 * itself — IDS unreachable, timing out, or answering 5xx.
 *
 * Marking the session invalid on one of these is unrecoverable: `isExpired`
 * returns false once `invalid` is set, so the middleware never retries and the
 * user is stuck until they log out and back in manually. Throwing instead lets
 * `tryToUpdateCookie` leave the session cookie untouched, so the next request
 * simply tries again.
 */
export class TransientRefreshError extends Error {
  readonly reason: unknown

  constructor(message: string, reason?: unknown) {
    super(message)
    // Name check rather than `instanceof`: this lib gets bundled more than once
    // across the monorepo (see @dmr.is/trpc's errorHandler for the same problem).
    this.name = 'TransientRefreshError'
    this.reason = reason
  }
}

export const isTransientRefreshError = (
  error: unknown,
): error is TransientRefreshError =>
  error instanceof Error && error.name === 'TransientRefreshError'

/**
 * Reads the token response, keeping "could not read it" distinguishable from
 * "read it, and it was empty".
 *
 * Collapsing the two is what let an unreadable success body — a gateway cutting
 * in with HTML, or our own abort landing mid-stream — reach the
 * `AccessTokenOrIdTokenMissing` branch and end the session, which is precisely
 * the failure class this module exists to avoid.
 */
const readBody = async (
  response: Response,
): Promise<
  { parsed: true; body: Record<string, unknown> } | { parsed: false }
> => {
  try {
    return {
      parsed: true,
      body: (await response.json()) as Record<string, unknown>,
    }
  } catch {
    return { parsed: false }
  }
}

/** Reads a JWT's `exp` for logging. Never throws — diagnostics must not fail a refresh. */
const expiresAt = (token: unknown): string | undefined => {
  if (typeof token !== 'string' || token.length === 0) {
    return undefined
  }

  try {
    const exp = decodeJwt(token).exp
    return typeof exp === 'number'
      ? new Date(exp * 1000).toISOString()
      : undefined
  } catch {
    return undefined
  }
}

export const isExpired = (
  accessToken: string,
  isRefreshTokenExpired: boolean,
) => {
  const decoded = decodeJwt(accessToken)

  if (decoded && !(typeof decoded === 'string') && decoded['exp']) {
    const expires = new Date(decoded.exp * 1000)
    const renewalTime = new Date(expires.getTime() - renewalSeconds * 1000)
    return new Date() > renewalTime && !isRefreshTokenExpired
  }

  return false
}

/**
 * Exchanges the refresh token for a fresh access/ID token pair.
 *
 * Returns a token carrying `invalid: true` only when the refresh token itself is
 * unusable and re-authentication is the only way forward. Failures that say
 * nothing about the refresh token throw {@link TransientRefreshError} instead —
 * see that class for why the distinction matters.
 */
export const refreshAccessToken = async (
  token: JWT,
  redirectUri?: string,
  clientId?: string,
  clientSecret?: string,
) => {
  const logger = getLogger(LOGGING_CATEGORY)

  if (!token.refreshToken) {
    logger.error('Refresh token missing', {
      error: 'RefreshTokenMissing',
      category: LOGGING_CATEGORY,
    })

    return { ...token, error: 'RefreshTokenMissing', invalid: true }
  }

  const abort = new AbortController()
  const timeout = setTimeout(() => abort.abort(), REFRESH_TIMEOUT_MS)

  let response: Response
  let body: Awaited<ReturnType<typeof readBody>>

  try {
    response = await fetch(
      `https://${process.env.IDENTITY_SERVER_DOMAIN}/connect/token`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        method: 'POST',
        body: new URLSearchParams({
          client_id: clientId ?? identityServerConfig.clientId,
          client_secret: clientSecret ?? identityServerConfig.clientSecret,
          grant_type: 'refresh_token',
          redirect_uri:
            redirectUri ?? process.env.IDENTITY_SERVER_LOGOUT_URL ?? '',
          refresh_token: token.refreshToken as string,
        }),
        signal: abort.signal,
      },
    )

    // Inside the abort scope on purpose: a response whose body never finishes
    // streaming is the one case that would hang every request collapsed onto
    // this call.
    body = await readBody(response)
  } catch (error) {
    // DNS, TLS, connection reset, or our own timeout. Treated as transient: we
    // cannot know whether an aborted request reached IDS, and assuming the
    // refresh token survived costs one failed retry, while assuming it died
    // costs the user their session.
    logger.warn('Refreshing failed, could not reach identity server', {
      error: error as Error,
      category: LOGGING_CATEGORY,
    })

    throw new TransientRefreshError('Could not reach identity server', error)
  } finally {
    clearTimeout(timeout)
  }

  const oauthError = body.parsed
    ? (body.body.error as string | undefined)
    : undefined

  if (!response.ok) {
    if (oauthError && TERMINAL_OAUTH_ERRORS.has(oauthError)) {
      logger.error('Refreshing failed, refresh token is no longer usable', {
        error: oauthError,
        metadata: { status: response.status },
        category: LOGGING_CATEGORY,
      })

      return { ...token, error: oauthError, invalid: true }
    }

    logger.warn('Refreshing failed, identity server rejected the request', {
      error: oauthError ?? `HTTP ${response.status}`,
      metadata: { status: response.status },
      category: LOGGING_CATEGORY,
    })

    throw new TransientRefreshError(
      `Identity server responded with ${response.status}`,
      oauthError ?? response.status,
    )
  }

  if (!body.parsed) {
    // HTTP 200 we could not read. IDS may well have rotated the refresh token,
    // but we have no tokens to store, so retrying is the only option that does
    // not throw away a session over an unreadable response.
    logger.warn('Refreshing failed, could not read the token response', {
      error: 'UnreadableTokenResponse',
      category: LOGGING_CATEGORY,
    })

    throw new TransientRefreshError('Could not read the token response')
  }

  const newTokens = body.body as {
    access_token?: string
    id_token?: string
    refresh_token?: string
    expires_in?: number
  }

  if (!newTokens.access_token || !newTokens.id_token) {
    logger.error('Access token or ID token missing', {
      error: 'AccessTokenOrIdTokenMissing',
      category: LOGGING_CATEGORY,
    })
    return { ...token, error: 'AccessTokenOrIdTokenMissing', invalid: true }
  }

  const prevIdExpires = expiresAt(token.idToken)
  const newIdExpires = expiresAt(newTokens.id_token)

  logger.info('Token refreshed', {
    metadata: {
      timeNow: new Date().toISOString(),
      prevExpires: expiresAt(token.accessToken),
      newExpires: expiresAt(newTokens.access_token),
      // DoE is the only app that also refreshes on ID-token expiry, which ties
      // its refresh cadence to a lifetime it does not control. These three
      // fields say whether that lifetime is shorter than the access token's,
      // and whether it advances on refresh at all — without anyone having to
      // decode a token by hand. Timestamps only; no token material.
      prevIdExpires,
      newIdExpires,
      idTokenAdvanced:
        prevIdExpires !== undefined && newIdExpires !== undefined
          ? newIdExpires > prevIdExpires
          : undefined,
    },
    category: LOGGING_CATEGORY,
  })

  return {
    ...token,
    accessToken: newTokens.access_token,
    idToken: newTokens.id_token,
    refreshToken: newTokens.refresh_token ?? token.refreshToken,
  }
}

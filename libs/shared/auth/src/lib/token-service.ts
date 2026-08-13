import { decodeJwt } from 'jose'
import { JWT } from 'next-auth/jwt'
import { getLogger } from '@dmr.is/logging-next'

import { identityServerConfig } from './identityServerConfig'

const LOGGING_CATEGORY = 'refreshAccessToken'

const renewalSeconds = 20 // seconds

/**
 * Statuses where IDS is telling us "not right now" rather than "this refresh
 * token is dead". The refresh token survives these, so the session must too.
 */
const TRANSIENT_HTTP_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504])

/**
 * Ceiling on a single `/connect/token` call.
 *
 * `fetch` has no timeout of its own, and concurrent refreshes are collapsed into
 * one shared call (see `refresh-single-flight`) — so a hung request would hang
 * every request waiting on it, not just its own.
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

const readBody = async (
  response: Response,
): Promise<Record<string, unknown>> => {
  try {
    return (await response.json()) as Record<string, unknown>
  } catch {
    // A gateway erroring out mid-request answers with HTML, not JSON.
    return {}
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

  let response: Response
  const abort = new AbortController()
  const timeout = setTimeout(() => abort.abort(), REFRESH_TIMEOUT_MS)

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

  const body = await readBody(response)

  if (!response.ok) {
    if (TRANSIENT_HTTP_STATUSES.has(response.status)) {
      logger.warn('Refreshing failed, identity server unavailable', {
        error: body.error ?? `HTTP ${response.status}`,
        metadata: { status: response.status },
        category: LOGGING_CATEGORY,
      })

      throw new TransientRefreshError(
        `Identity server responded with ${response.status}`,
        body,
      )
    }

    logger.error('Refreshing failed', {
      error: body.error ?? `HTTP ${response.status}`,
      metadata: { status: response.status },
      category: LOGGING_CATEGORY,
    })

    return {
      ...token,
      error: (body.error as string) ?? 'RefreshAccessTokenError',
      invalid: true,
    }
  }

  const newTokens = body as {
    access_token?: string
    id_token?: string
    refresh_token?: string
    expires_in: number
  }

  if (!newTokens.access_token || !newTokens.id_token) {
    logger.error('Access token or ID token missing', {
      error: 'AccessTokenOrIdTokenMissing',
      category: LOGGING_CATEGORY,
    })
    return { ...token, error: 'AccessTokenOrIdTokenMissing', invalid: true }
  }

  const expiresIn = Math.floor(Date.now() + newTokens.expires_in * 1000)
  const decodedOldAccessToken = decodeJwt(token.accessToken)

  logger.info('Token refreshed', {
    metadata: {
      timeNow: new Date().toISOString(),
      prevExpires: new Date(
        (decodedOldAccessToken.exp as number) * 1000,
      ).toISOString(),
      newExpires: new Date(expiresIn).toISOString(),
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

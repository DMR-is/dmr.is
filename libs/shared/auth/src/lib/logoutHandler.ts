import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getLogger } from '@dmr.is/logging-next'

import { revokeRefreshToken } from './revokeRefreshToken'
import { expireAppAuthCookies, sessionCookieNames } from './sessionCookies'

const logger = getLogger('logout-handler')

/**
 * The origin the app is served from publicly: `NEXTAUTH_URL`'s, falling back
 * to the one Next sees. Behind a load balancer `request.nextUrl.origin` can be
 * the internal host. An unparsable `NEXTAUTH_URL` is ignored, never thrown.
 */
const appOrigin = (request: NextRequest) => {
  try {
    if (process.env.NEXTAUTH_URL)
      return new URL(process.env.NEXTAUTH_URL).origin
  } catch {
    // an unparsable NEXTAUTH_URL contributes nothing
  }
  return request.nextUrl.origin
}

/** Origins this app is served from: the one Next sees and the public one. */
const trustedOrigins = (request: NextRequest) =>
  new Set([request.nextUrl.origin, appOrigin(request)])

/**
 * Same-origin requests only. `Sec-Fetch-Site`, when sent, decides; otherwise
 * the `Origin` header must be one of this app's own origins. A request with
 * neither header is refused.
 */
const isSameOrigin = (request: NextRequest) => {
  const fetchSite = request.headers.get('sec-fetch-site')
  if (fetchSite !== null) return fetchSite === 'same-origin'

  const origin = request.headers.get('origin')
  return origin !== null && trustedOrigins(request).has(origin)
}

/**
 * The post-logout URI to send to the identity server. An absolute URI is
 * returned byte for byte: the identity server may match registered URIs
 * exactly, and normalising would turn a bare origin into `https://<host>/`.
 * Only a relative or empty value is resolved, against the app's origin; empty
 * becomes the origin root (`<origin>/`).
 */
const resolveRedirectUri = (request: NextRequest, uri?: string) => {
  if (uri && URL.canParse(uri)) return uri

  const base = appOrigin(request)
  try {
    return new URL(uri || '/', base).toString()
  } catch {
    return new URL('/', base).toString()
  }
}

/**
 * The identity server's end-session URL. The one place it is built, for logout
 * and the access-denied routes, so both send the same `post_logout_redirect_uri`
 * for one configured value.
 */
export const endSessionUrl = (
  request: NextRequest,
  postLogoutRedirectUri: string | undefined,
  idTokenHint?: string,
) => {
  const params = new URLSearchParams({
    post_logout_redirect_uri: resolveRedirectUri(
      request,
      postLogoutRedirectUri,
    ),
  })
  if (idTokenHint) params.set('id_token_hint', idTokenHint)

  return `https://${process.env.IDENTITY_SERVER_DOMAIN}/connect/endsession?${params.toString()}`
}

// The first session cookie name that yields a token. An app on NextAuth's
// default names is tried under both variants: NextAuth picks `__Secure-` from
// the NEXTAUTH_URL scheme, which can disagree with NODE_ENV.
const readSession = async (request: NextRequest, cookiePrefix?: string) => {
  for (const cookieName of sessionCookieNames(cookiePrefix)) {
    const token = await getToken({ req: request, cookieName })
    if (token) return token
  }
  return null
}

/**
 * Ends the NextAuth session and sends the browser to the identity server's
 * end-session endpoint, in one response.
 *
 * Meant to be the target of a same-origin top-level form POST. Any other
 * request gets a 403 before a cookie is read or touched, and nothing is
 * revoked. The id_token is read from the HttpOnly session cookie and appears
 * only in the `Location` header that points at the identity server; it is
 * never in a response body or in a URL this app serves.
 *
 * After the origin check the refresh token is revoked (when
 * `identityServerConfig` is given; a failure is logged and does not stop the
 * logout), then every cookie of the app's NextAuth set is expired - `Secure`
 * where the name is `__Secure-` / `__Host-` prefixed, and the chunks
 * (`<session cookie>.0`, `.1`, ...) of a large session included. Without a
 * session the cookies are still cleared and the browser is sent straight to the
 * post-logout URI (a navigation to the app, so `NextResponse.redirect`
 * normalising it is harmless). With a session, `post_logout_redirect_uri` is
 * built by `endSessionUrl`: an absolute URI is passed through unchanged.
 *
 * @param cookiePrefix the app's cookie prefix when it has opted into its own
 * names (see sessionCookies.ts); omitted, NextAuth's default names are used.
 * @param identityServerConfig the app's client credentials, used to revoke the
 * refresh token.
 */
export const endSessionHandler = async (
  request: NextRequest,
  postLogoutRedirectUri: string | undefined,
  cookiePrefix?: string,
  identityServerConfig?: { clientId: string; clientSecret: string },
) => {
  if (!isSameOrigin(request)) {
    return new Response(null, {
      status: 403,
      headers: { 'Cache-Control': 'no-store' },
    })
  }

  const token = await readSession(request, cookiePrefix)

  if (token && identityServerConfig && typeof token.refreshToken === 'string') {
    try {
      await revokeRefreshToken(token.refreshToken, identityServerConfig)
    } catch (error) {
      logger.error('Error revoking refresh token', { error })
    }
  }

  const location = token
    ? endSessionUrl(
        request,
        postLogoutRedirectUri,
        typeof token.idToken === 'string' ? token.idToken : undefined,
      )
    : resolveRedirectUri(request, postLogoutRedirectUri)

  // 303 so the browser follows with a GET whatever the method of this request.
  const response = NextResponse.redirect(location, 303)
  response.headers.set('Cache-Control', 'no-store')
  expireAppAuthCookies(request, response, cookiePrefix)

  return response
}

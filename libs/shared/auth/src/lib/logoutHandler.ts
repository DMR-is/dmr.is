import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

import { expireAppAuthCookies, sessionCookieName } from './sessionCookies'

/**
 * Origins this app is served from: the one Next sees, and the one the app is
 * configured with. Behind a load balancer `request.nextUrl.origin` can be the
 * internal host, so `NEXTAUTH_URL` (the public URL) is accepted as well.
 */
const trustedOrigins = (request: NextRequest) => {
  const origins = new Set([request.nextUrl.origin])
  try {
    if (process.env.NEXTAUTH_URL) {
      origins.add(new URL(process.env.NEXTAUTH_URL).origin)
    }
  } catch {
    // an unparsable NEXTAUTH_URL contributes nothing
  }
  return origins
}

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
 * The post-logout URI as an absolute URL: a relative or missing value is
 * resolved against the app's own origin, so a redirect can always be built.
 */
const resolveRedirectUri = (request: NextRequest, uri?: string) => {
  const base = process.env.NEXTAUTH_URL
    ? new URL(process.env.NEXTAUTH_URL).origin
    : request.nextUrl.origin
  try {
    return new URL(uri || '/', base).toString()
  } catch {
    return new URL('/', base).toString()
  }
}

/**
 * Ends the NextAuth session and sends the browser to the identity server's
 * end-session endpoint, in one response.
 *
 * Meant to be the target of a same-origin top-level form POST; any other
 * origin gets a 403 before a cookie is read or touched. The id_token is read
 * from the HttpOnly session cookie and appears only in the `Location` header
 * that points at the identity server; it is never in a response body or in a
 * URL this app serves.
 *
 * Every cookie of the app's NextAuth set is expired with the attributes it was
 * set with, including the chunks (`<session cookie>.0`, `.1`, …) of a large
 * session. Without a session the cookies are still cleared and the browser is
 * sent to `postLogoutRedirectUri`.
 *
 * @param cookiePrefix the app's cookie prefix when it has opted into its own
 * names (see sessionCookies.ts); omitted, NextAuth's default names are used.
 */
export const endSessionHandler = async (
  request: NextRequest,
  postLogoutRedirectUri: string | undefined,
  cookiePrefix?: string,
) => {
  if (!isSameOrigin(request)) {
    return new Response(null, {
      status: 403,
      headers: { 'Cache-Control': 'no-store' },
    })
  }

  const token = await getToken({
    req: request,
    cookieName: sessionCookieName(cookiePrefix),
  })

  const redirectUri = resolveRedirectUri(request, postLogoutRedirectUri)
  let location = redirectUri

  if (token) {
    const params = new URLSearchParams({
      post_logout_redirect_uri: redirectUri,
    })

    if (token.idToken) {
      params.set('id_token_hint', token.idToken as string)
    }

    location = `https://${process.env.IDENTITY_SERVER_DOMAIN}/connect/endsession?${params.toString()}`
  }

  // 303 so the browser follows with a GET whatever the method of this request.
  const response = NextResponse.redirect(location, 303)
  response.headers.set('Cache-Control', 'no-store')
  expireAppAuthCookies(request, response, cookiePrefix)

  return response
}

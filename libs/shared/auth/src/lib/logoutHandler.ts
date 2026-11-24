import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

import { appAuthCookies, sessionCookieName } from './sessionCookies'

const DEFAULT_COOKIE_PREFIX = 'next-auth'

/**
 * Ends the NextAuth session and sends the browser to the identity server's
 * end-session endpoint, in one response.
 *
 * Meant to be the target of a top-level form POST. The id_token is read from
 * the HttpOnly session cookie and appears only in the `Location` header that
 * points at the identity server; it is never in a response body or in a URL
 * this app serves.
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
  postLogoutRedirectUri: string,
  cookiePrefix?: string,
) => {
  if (request.method !== 'POST') {
    return new Response(null, { status: 405, headers: { Allow: 'POST' } })
  }

  const prefix = cookiePrefix || DEFAULT_COOKIE_PREFIX
  const sessionName = sessionCookieName(cookiePrefix)
  const token = await getToken({ req: request, cookieName: sessionName })

  let location = postLogoutRedirectUri

  if (token) {
    const params = new URLSearchParams({
      post_logout_redirect_uri: postLogoutRedirectUri,
    })

    if (token.idToken) {
      params.set('id_token_hint', token.idToken as string)
    }

    location = `https://${process.env.IDENTITY_SERVER_DOMAIN}/connect/endsession?${params.toString()}`
  }

  // 303 so the browser follows with a GET whatever the method of this request.
  const response = NextResponse.redirect(location, 303)
  response.headers.set('Cache-Control', 'no-store')

  // Expire with the attributes the cookie was set with (notably `Secure`): a
  // bare delete of a `__Secure-` / `__Host-` cookie is rejected by browsers.
  const expire = (name: string, options: object) =>
    response.cookies.set(name, '', {
      ...options,
      maxAge: 0,
      expires: new Date(0),
    })

  for (const { name, options } of Object.values(appAuthCookies(prefix))) {
    if (name && options) expire(name, options)
  }

  const sessionOptions = appAuthCookies(prefix).sessionToken?.options ?? {}
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith(sessionName)) {
      expire(cookie.name, sessionOptions)
    }
  }

  return response
}

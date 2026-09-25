import { NextRequest, NextResponse } from 'next/server'

import {
  expiredAuthCookieOptions,
  isAppAuthCookie,
} from '@dmr.is/auth/sessionCookies'

import { AUTH_COOKIE_PREFIX } from '../../../../lib/auth/identityServerConfig'
import {
  LOGOUT_HINT_COOKIE,
  LOGOUT_HINT_COOKIE_PATH,
} from '../../../../lib/auth/logoutHint'

export const dynamic = 'force-dynamic'

// A refused sign-in (no company nationalId on the token) still leaves an
// upstream IDS session alive. Without ending it, a retry from /innskraning
// SSOs the same token straight back in and the refusal loops forever. This
// ends the IDS session via /connect/endsession.
//
// post_logout_redirect_uri is the bare origin, not a subpath: IDS will not
// redirect anywhere that isn't registered for this client, and the origin is
// the URI most likely already registered for this client family. `/`
// requires auth, so the middleware sends the returning browser on to
// `/innskraning?callbackUrl=/` -- the page with the retry button, and where
// the signin_error cookie below gets read.
function handler(request: NextRequest) {
  const idToken = request.cookies.get(LOGOUT_HINT_COOKIE)?.value

  const params = new URLSearchParams({
    post_logout_redirect_uri: process.env.BASE_URL as string,
  })

  if (idToken) {
    params.set('id_token_hint', idToken)
  }
  // else: the handoff cookie is missing or expired. Degrade to an end-session
  // request without the hint rather than sending the literal string "null" -
  // IDS may show its own logout prompt in that case.

  const response = NextResponse.redirect(
    `https://${process.env.IDENTITY_SERVER_DOMAIN}/connect/endsession?${params.toString()}`,
  )

  for (const cookie of request.cookies.getAll()) {
    // This app's NextAuth cookies only. Matching every `next-auth.*` cookie
    // here once signed the user out of any other app on the same host.
    if (isAppAuthCookie(cookie.name, AUTH_COOKIE_PREFIX)) {
      // Expired with `Secure`, not deleted: a bare delete of a `__Secure-` or
      // `__Host-` cookie is rejected by the browser, so in production it
      // cleared nothing.
      response.cookies.set(cookie.name, '', expiredAuthCookieOptions())
    }
  }

  response.cookies.set(LOGOUT_HINT_COOKIE, '', {
    path: LOGOUT_HINT_COOKIE_PATH,
    maxAge: 0,
  })

  response.cookies.set('doe-partner.signin_error', '1', {
    path: '/',
    maxAge: 60,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  })

  return response
}

export { handler as GET, handler as POST }

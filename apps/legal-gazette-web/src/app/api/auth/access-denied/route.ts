import { NextRequest, NextResponse } from 'next/server'

import {
  expiredAuthCookieOptions,
  isAppAuthCookie,
} from '@dmr.is/auth/sessionCookies'

import { AUTH_COOKIE_PREFIX } from '../../../../lib/auth/authOptions'
import {
  LOGOUT_HINT_COOKIE,
  LOGOUT_HINT_COOKIE_PATH,
} from '../../../../lib/auth/logoutHint'
import { SIGNIN_ERROR_COOKIE } from '../../../../lib/auth/signinError'

export const dynamic = 'force-dynamic'

// Ends the identity server session after a refused sign-in. Without this the
// next login silently signs the same person in again and loops.
function handler(request: NextRequest) {
  const idToken = request.cookies.get(LOGOUT_HINT_COOKIE)?.value

  // No hint means this wasn't a refused sign-in (e.g. a link from elsewhere)
  if (!idToken) {
    return NextResponse.redirect(new URL('/innskraning', request.url))
  }

  const postLogoutRedirectUri = process.env.BASE_URL as string

  const params = new URLSearchParams({
    post_logout_redirect_uri: postLogoutRedirectUri,
    id_token_hint: idToken,
  })

  const response = NextResponse.redirect(
    `https://${process.env.IDENTITY_SERVER_DOMAIN}/connect/endsession?${params.toString()}`,
  )

  // This app's NextAuth cookies only, so a session from an earlier sign-in
  // can't carry on after a refused one. Expired rather than deleted, so
  // __Secure- cookies are cleared too.
  for (const cookie of request.cookies.getAll()) {
    if (isAppAuthCookie(cookie.name, AUTH_COOKIE_PREFIX)) {
      response.cookies.set(cookie.name, '', expiredAuthCookieOptions())
    }
  }

  response.cookies.set(LOGOUT_HINT_COOKIE, '', {
    path: LOGOUT_HINT_COOKIE_PATH,
    maxAge: 0,
  })

  response.cookies.set(SIGNIN_ERROR_COOKIE, 'AccessDenied', {
    path: '/',
    maxAge: 60,
    sameSite: 'lax',
  })

  return response
}

export { handler as GET }

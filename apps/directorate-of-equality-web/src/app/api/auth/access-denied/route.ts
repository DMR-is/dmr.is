import { NextRequest, NextResponse } from 'next/server'

import { endSessionUrl } from '@dmr.is/auth/logoutHandler'
import { expireAppAuthCookies } from '@dmr.is/auth/sessionCookies'

import { AUTH_COOKIE_PREFIX } from '../../../../lib/auth/identityServerConfig'
import {
  LOGOUT_HINT_COOKIE,
  LOGOUT_HINT_COOKIE_PATH,
} from '../../../../lib/auth/logoutHint'

export const dynamic = 'force-dynamic'

function handler(request: NextRequest) {
  const idToken = request.cookies.get(LOGOUT_HINT_COOKIE)?.value

  // No hint (the handoff cookie is missing or expired) degrades to an
  // end-session request without it rather than sending the literal string
  // "null" - IDS may show its own logout prompt in that case.
  const response = NextResponse.redirect(
    endSessionUrl(request, process.env.BASE_URL, idToken),
  )

  // This app's NextAuth cookies only, expired rather than deleted so
  // __Secure- / __Host- cookies are cleared too.
  expireAppAuthCookies(request, response, AUTH_COOKIE_PREFIX)

  response.cookies.set(LOGOUT_HINT_COOKIE, '', {
    path: LOGOUT_HINT_COOKIE_PATH,
    maxAge: 0,
  })

  response.cookies.set('doe.signin_error', '1', {
    path: '/',
    maxAge: 60,
    sameSite: 'lax',
  })

  return response
}

export { handler as GET, handler as POST }

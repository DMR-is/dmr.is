import { NextRequest, NextResponse } from 'next/server'

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

  const postLogoutRedirectUri = process.env.BASE_URL as string

  const params = new URLSearchParams({
    post_logout_redirect_uri: postLogoutRedirectUri,
  })

  if (idToken) {
    params.set('id_token_hint', idToken)
  }

  const response = NextResponse.redirect(
    `https://${process.env.IDENTITY_SERVER_DOMAIN}/connect/endsession?${params.toString()}`,
  )

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

export { handler as GET, handler as POST }

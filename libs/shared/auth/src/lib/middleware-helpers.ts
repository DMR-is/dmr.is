import { NextRequest, NextResponse } from 'next/server'
import { encode, JWT } from 'next-auth/jwt'

import { refreshAccessToken } from './token-service'

const SESSION_COOKIE = 'next-auth.session-token'
const SESSION_TIMEOUT = 60 * 60 // 1 hour
const SESSION_SECURE = process.env.NODE_ENV === 'production'

export function updateCookie(
  sessionToken: string | null,
  request: NextRequest,
  response: NextResponse,
): NextResponse<unknown> {
  /*
   * BASIC IDEA:
   *
   * 1. Set request cookies for the incoming getServerSession to read new session
   * 2. Updated request cookie can only be passed to server if it's passed down here after setting its updates
   * 3. Set response cookies to send back to browser
   */

  if (sessionToken) {
    // Set the session token in the request and response cookies for a valid session
    request.cookies.set(SESSION_COOKIE, sessionToken)
    response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
    response.cookies.set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      maxAge: SESSION_TIMEOUT,
      secure: SESSION_SECURE,
      sameSite: 'lax',
    })
  } else {
    response.cookies.delete(SESSION_COOKIE)
  }

  return response
}

export async function tryToUpdateCookie(
  clientId: string,
  clientSecret: string,
  req: NextRequest,
  token: JWT,
  response: NextResponse,
): Promise<NextResponse> {
  try {
    const redirectUri =
      process.env.LG_PUBLIC_WEB_URL ?? process.env.IDENTITY_SERVER_LOGOUT_URL

    const newSessionToken = await encode({
      secret: process.env.NEXTAUTH_SECRET as string,
      token: await refreshAccessToken(
        token as JWT,
        redirectUri,
        clientId,
        clientSecret,
      ),
      maxAge: SESSION_TIMEOUT,
    })
    return updateCookie(newSessionToken, req, response)
  } catch (error) {
    return updateCookie(null, req, response)
  }
}

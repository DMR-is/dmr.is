import { NextRequest, NextResponse } from 'next/server'
import { encode, JWT } from 'next-auth/jwt'
import type { NextRequestWithAuth } from 'next-auth/middleware'
import { withAuth } from 'next-auth/middleware'

import { refreshAccessToken } from './token-service'
import { isExpired } from './token-service'

const SESSION_SECURE = process.env.NODE_ENV === 'production'
const SESSION_COOKIE = SESSION_SECURE
  ? '__Secure-next-auth.session-token'
  : 'next-auth.session-token'
const SESSION_TIMEOUT = 60 * 60 // 1 hour

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
  redirectUri: string,
): Promise<NextResponse> {
  try {
    const newToken = await refreshAccessToken(
      token as JWT,
      redirectUri,
      clientId,
      clientSecret,
    )

    if (newToken.invalid) {
      return updateCookie(null, req, response)
    }

    const newSessionToken = await encode({
      secret: process.env.NEXTAUTH_SECRET as string,
      token: newToken,
      maxAge: SESSION_TIMEOUT,
    })
    return updateCookie(newSessionToken, req, response)
  } catch (error) {
    return updateCookie(null, req, response)
  }
}

const DEFAULT_URL = '/'

export interface CreateAuthMiddlewareConfig {
  clientId: string
  clientSecret: string
  redirectUriEnvVar: string
  fallbackRedirectUri: string
  signInPath: string
  checkIsActive?: boolean
}

export function createAuthMiddleware(config: CreateAuthMiddlewareConfig) {
  const {
    clientId,
    clientSecret,
    redirectUriEnvVar,
    fallbackRedirectUri,
    signInPath,
    checkIsActive = false,
  } = config

  const middleware = withAuth(
    async function middleware(req: NextRequestWithAuth) {
      let response = NextResponse.next()

      const token = req.nextauth.token

      if (token && isExpired(token.accessToken as string, !!token.invalid)) {
        const redirectUri =
          process.env[redirectUriEnvVar] ?? fallbackRedirectUri
        response = await tryToUpdateCookie(
          clientId,
          clientSecret,
          req,
          token,
          response,
          redirectUri,
        )
      }
      return response
    },
    {
      pages: {
        signIn: signInPath,
      },
      callbacks: {
        authorized: ({ token, req }) => {
          const requestedPath = req.nextUrl.pathname

          if (
            DEFAULT_URL === requestedPath ||
            requestedPath.includes('/api/trpc')
          ) {
            return true
          }


          if (checkIsActive) {
            return !!token && !token.invalid && !!token.isActive
          }

          return !!token && !token.invalid
        },
      },
    },
  )

  return middleware
}

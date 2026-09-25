import { NextResponse } from 'next/server'
import type { NextRequestWithAuth } from 'next-auth/middleware'
import { withAuth } from 'next-auth/middleware'

import {
  tryToUpdateCookie,
  updateCookie,
} from '@dmr.is/auth/middleware-helpers'
import { sessionCookieName } from '@dmr.is/auth/sessionCookies'
import { isExpired } from '@dmr.is/auth/token-service'

import {
  AUTH_COOKIE_PREFIX,
  identityServerConfig,
} from './lib/auth/identityServerConfig'

const SESSION_COOKIE = sessionCookieName(AUTH_COOKIE_PREFIX)

export default withAuth(
  async function middleware(req: NextRequestWithAuth) {
    let response = NextResponse.next()
    const token = req.nextauth.token

    if (!token) return response

    const accessExpired = isExpired(
      token.accessToken as string,
      !!token.invalid,
    )
    const idTokenExpired = token.idToken
      ? isExpired(token.idToken as string, !!token.invalid)
      : false

    if (accessExpired || idTokenExpired) {
      const redirectUri = process.env.BASE_URL as string

      const result = await tryToUpdateCookie(
        identityServerConfig.clientId,
        identityServerConfig.clientSecret,
        req,
        token,
        response,
        redirectUri,
        SESSION_COOKIE,
      )
      response = result.response

      if (result.newSessionToken) {
        return updateCookie(
          result.newSessionToken,
          req,
          response,
          SESSION_COOKIE,
        )
      }
    }

    return response
  },
  {
    // Must match authOptions.cookies, or withAuth reads NextAuth's default
    // name and sees no session.
    cookies: { sessionToken: { name: SESSION_COOKIE } },
    pages: {
      signIn: '/innskraning',
    },
    callbacks: {
      authorized: ({ token, req }) => {
        const requestedPath = req.nextUrl.pathname

        if (requestedPath.includes('/api/trpc')) {
          return true
        }

        return !!token && !token.invalid
      },
    },
  },
)

export const config = {
  matcher: [
    `/((?!api|innskraning|error|_next/static|_next/image|images|fonts|.well-known|assets|favicon.ico).*)`,
    '/api/trpc/(.*)',
  ],
}

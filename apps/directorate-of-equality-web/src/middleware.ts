import { NextResponse } from 'next/server'
import type { NextRequestWithAuth } from 'next-auth/middleware'
import { withAuth } from 'next-auth/middleware'

import {
  tryToUpdateCookie,
  updateCookie,
} from '@dmr.is/auth/middleware-helpers'
import { isExpired } from '@dmr.is/auth/token-service'

import { identityServerConfig } from './lib/auth/authOptions'

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
      const redirectUri =
        process.env.DOE_WEB_URL ??
        (process.env.IDENTITY_SERVER_LOGOUT_URL as string)

      const result = await tryToUpdateCookie(
        identityServerConfig.clientId,
        identityServerConfig.clientSecret,
        req,
        token,
        response,
        redirectUri,
      )
      response = result.response

      if (result.newSessionToken) {
        return updateCookie(result.newSessionToken, req, response)
      }
    }

    return response
  },
  {
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

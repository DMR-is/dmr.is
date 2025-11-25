import { NextResponse } from 'next/server'
import { withAuth } from 'next-auth/middleware'

import { tryToUpdateCookie } from '@dmr.is/auth/middleware-helpers'
import { isExpired } from '@dmr.is/auth/token-service'

import { identityServerConfig } from './lib/authOptions'

const DEFAULT_URL = '/'

export default withAuth(
  async function middleware(req) {
    let response = NextResponse.next()

    const token = req.nextauth.token

    if (token && isExpired(token.accessToken as string, !!token.invalid)) {
      response = await tryToUpdateCookie(
        identityServerConfig.clientId,
        identityServerConfig.clientSecret,
        req,
        token,
        response,
      )
    }
    return response
  },
  {
    pages: {
      signIn: '/skraning',
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
        return !!token && !token.invalid && !!token.isActive
      },
    },
  },
)

// create a config that matches all routes except static files, /innskraning and non-trpc API routes
export const config = {
  matcher: [
    '/((?!api|skraning|sidur.*|_next/static|_next/image|images|fonts|.well-known|favicon.ico).*)',
    '/api/trpc/(.*)',
  ],
}

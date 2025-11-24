import { NextMiddleware, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

import { tryToUpdateCookie } from '@dmr.is/auth/middleware-helpers'
import { isExpired } from '@dmr.is/auth/token-service'

import { identityServerConfig } from './lib/authOptions'

const DEFAULT_URL = '/'

export const middleware: NextMiddleware = async (req) => {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const isAuthenticated = !!token
  let response = NextResponse.next()

  if (DEFAULT_URL === req.nextUrl.pathname && !isAuthenticated) {
    return response
  }
  if (!isAuthenticated) {
    const loginUrl = new URL('/', req.url)
    return NextResponse.redirect(loginUrl)
  }
  if (isExpired(token.accessToken as string, !!token.invalid)) {
    response = await tryToUpdateCookie(
      identityServerConfig.clientId,
      identityServerConfig.clientSecret,
      req,
      token,
      response,
    )
  }
  return response
}

export const config = {
  matcher: [
    '/((?!api/.*|.*\\.|innskraning|$).*)',
    '/api/trpc/:path*', // All tRPC routes
  ],
}

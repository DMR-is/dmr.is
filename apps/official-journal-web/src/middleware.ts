import { NextFetchEvent, NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

import { createAuthMiddleware } from '@dmr.is/auth/middleware-helpers'

import { identityServerConfig } from './lib/auth/authOptions'

const ADMIN_ONLY_ROUTES = [
  '/',
  '/yfirflokkar',
  '/tegundir',
  '/ritstjorn',
  '/utgafa',
  '/heildaryfirlit',
]

const authMiddleware = createAuthMiddleware({
  clientId: identityServerConfig.clientId,
  clientSecret: identityServerConfig.clientSecret,
  redirectUriEnvVar: 'OFFICIAL_JOURNAL_WEB_URL',
  fallbackRedirectUri: process.env.IDENTITY_SERVER_LOGOUT_URL as string,
  signInPath: '/innskraning',
  checkIsActive: false,
  skipDefaultUrlCheck: true,
})

export default async function middleware(
  req: NextRequest,
  event: NextFetchEvent,
) {
  // Run auth middleware (handles token validation + refresh + cookie management)
  const authResponse = await (
    authMiddleware as (
      req: NextRequest,
      event: NextFetchEvent,
    ) => Promise<NextResponse>
  )(req, event)

  // If auth middleware returned a redirect (e.g., to signIn), return as-is
  if (authResponse?.status >= 300 && authResponse?.status < 400) {
    return authResponse
  }

  // For admin-only routes, check role
  // Root '/' must use exact match only — startsWith('/') is always true
  const isAdminRoute = ADMIN_ONLY_ROUTES.some((route) => {
    if (route === '/') return req.nextUrl.pathname === '/'
    return (
      req.nextUrl.pathname === route ||
      req.nextUrl.pathname.startsWith(`${route}/`)
    )
  })

  if (isAdminRoute) {
    const token = await getToken({ req })
    const role = token?.role as { slug?: string } | undefined
    const isAdmin = role?.slug === 'ritstjori'

    if (!isAdmin) {
      return NextResponse.redirect(new URL('/notendur', req.url))
    }
  }

  return authResponse
}

export const config = {
  matcher: [
    `/((?!api|innskraning|_next/static|_next/image|images|fonts|.well-known|assets|favicon.ico).*)`,
    '/api/trpc/(.*)',
  ],
}

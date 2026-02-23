import { createAuthMiddleware } from '@dmr.is/auth/middleware-helpers'

import { identityServerConfig } from './lib/auth/authOptions'

export default createAuthMiddleware({
  clientId: identityServerConfig.clientId,
  clientSecret: identityServerConfig.clientSecret,
  redirectUriEnvVar: 'OFFICIAL_JOURNAL_WEB_URL',
  fallbackRedirectUri: process.env.IDENTITY_SERVER_LOGOUT_URL as string,
  signInPath: '/innskraning',
  checkIsActive: false,
  skipDefaultUrlCheck: true,
})

export const config = {
  matcher: [
    `/((?!api|innskraning|_next/static|_next/image|images|fonts|.well-known|assets|favicon.ico).*)`,
    '/api/trpc/(.*)',
  ],
}

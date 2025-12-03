import { createAuthMiddleware } from '@dmr.is/auth/middleware-helpers'

import { identityServerConfig } from './lib/authOptions'

export default createAuthMiddleware({
  clientId: identityServerConfig.clientId,
  clientSecret: identityServerConfig.clientSecret,
  redirectUriEnvVar: 'LG_PUBLIC_WEB_URL',
  fallbackRedirectUri: process.env.IDENTITY_SERVER_LOGOUT_URL as string,
  signInPath: '/skraning',
  checkIsActive: true,
})

export const config = {
  matcher: [
    // Exclude specific paths from authentication
    // This should be statically defined as dynamic values do not work
    // for each route to exclude, add it to the list in following patterns: |<route>|
    `/((?!api|skraning|sidur.*|_next/static|_next/image|images|fonts|.well-known|favicon.ico).*)`,
    '/api/trpc/(.*)',
  ],
}

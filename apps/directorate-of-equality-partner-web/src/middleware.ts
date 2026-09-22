import { createAuthMiddleware } from '@dmr.is/auth/middleware-helpers'

import { identityServerConfig } from './lib/auth/identityServerConfig'

// createAuthMiddleware only refreshes on access-token expiry (isExpired on
// token.accessToken) -- it has no id-token branch the way doe-web's
// hand-rolled middleware does. This app authenticates to
// directorate-of-equality-api with session.idToken, not the access token, so
// if the id token expires first every API call 401s while the middleware
// sees nothing wrong, and session.invalid never gets set to recover it. This
// only holds as long as DOE_PARTNER_WEB_CLIENT_ID's id_token lifetime is at
// least as long as its access-token lifetime -- if that IDS client
// configuration ever changes, this helper needs an id-token check added.
export default createAuthMiddleware({
  clientId: identityServerConfig.clientId,
  clientSecret: identityServerConfig.clientSecret,
  redirectUriEnvVar: 'BASE_URL',
  fallbackRedirectUri: process.env.BASE_URL as string,
  signInPath: '/innskraning',
  checkIsActive: false,
  skipDefaultUrlCheck: true,
})

export const config = {
  matcher: [
    // Exclude specific paths from authentication
    // This should be statically defined as dynamic values do not work
    // for each route to exclude, add it to the list in following patterns: |<route>|
    `/((?!api|innskraning|error|_next/static|_next/image|images|fonts|.well-known|favicon.ico).*)`,
    '/api/trpc/(.*)',
  ],
}

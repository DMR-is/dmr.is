import { createAuthMiddleware } from '@dmr.is/auth/middleware-helpers'

import {
  AUTH_COOKIE_PREFIX,
  identityServerConfig,
} from './lib/auth/identityServerConfig'

// This app authenticates to directorate-of-equality-api with
// session.accessToken. That works only because the client requests the
// `@jafnretti.is/doe-partner-web` API resource scope: without it IDS issues an
// access token carrying no identity at all -- no nationalId, no actor -- and
// CompanyResourceGuard has nothing to resolve a company from. See
// identityServerConfig.ts.
//
// The ID token is still issued and still stored on the session, but only the
// browser side uses it: `name` and `subjectType` are ID-token-only claims, and
// logout needs it as `id_token_hint`. It is no longer sent to the API.
//
// Refreshing on access-token expiry alone is therefore correct here, which is
// what the shared helper does.
export default createAuthMiddleware({
  clientId: identityServerConfig.clientId,
  clientSecret: identityServerConfig.clientSecret,
  redirectUriEnvVar: 'BASE_URL',
  fallbackRedirectUri: process.env.BASE_URL as string,
  signInPath: '/innskraning',
  checkIsActive: false,
  skipDefaultUrlCheck: true,
  cookiePrefix: AUTH_COOKIE_PREFIX,
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

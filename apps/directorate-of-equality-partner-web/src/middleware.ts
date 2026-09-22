import { createAuthMiddleware } from '@dmr.is/auth/middleware-helpers'

import { identityServerConfig } from './lib/auth/identityServerConfig'

// This app authenticates to directorate-of-equality-api with session.idToken,
// not the access token, because the access token carries no identity: its
// claims are scope, client_id, sub, sid, idp, acr and jti -- no nationalId,
// no name, no actor. All of those live on the ID token, and
// CompanyResourceGuard resolves the company from user.nationalId.
//
// That is also why sending BOTH tokens (`Bearer <access>, Bearer <id>`, which
// TokenJwtAuthGuard supports and the two public legal-gazette webs use for
// their scope-guarded routes) does not work here: the guard builds
// request.user from the FIRST token and lifts only name and actor off the
// second, so nationalId would come back undefined and every request would
// 401.
//
// The helper refreshes on access-token expiry alone, which is sufficient:
// this client issues both tokens with the same 300s lifetime and the same
// exp, so the ID token can never expire first. If that ever stops being true
// -- check a decoded pair rather than assuming -- the helper needs an
// ID-token branch, and doe-web's hand-rolled middleware shows the shape.
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

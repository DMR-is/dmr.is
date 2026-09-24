import { identityServerId } from '@dmr.is/auth/identityProvider'

// Kept apart from authOptions.ts so Edge middleware can import this config
// without pulling in authOptions' Node-only modules (e.g. next/headers).
export const identityServerConfig = {
  id: identityServerId,
  name: 'Iceland authentication service',
  // The API resource scope is what puts `nationalId` on the access token --
  // without it IDS issues a bare userinfo token (scope, client_id, sub, sid,
  // idp, acr, jti) and the API has no company to resolve. It must also be
  // enabled for delegation on the IDS side: a scope that is not silently
  // vanishes from a procuration login's token while sign-in still succeeds.
  scope: `openid offline_access profile @jafnretti.is/doe-partner-web`,
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  clientId: process.env.DOE_PARTNER_WEB_CLIENT_ID!,
  clientSecret: process.env.DOE_PARTNER_WEB_CLIENT_SECRET ?? '',
}

// This app's NextAuth cookie prefix. Every place that names the session
// cookie reads it from here — authOptions, the middleware and the auth route
// handlers — because they must agree. Why it exists: sessionCookies.ts in
// @dmr.is/auth.
export const AUTH_COOKIE_PREFIX = 'doe-partner-web'

import { createAuthMiddleware } from '@dmr.is/auth/middleware-helpers'

import { identityServerConfig } from './lib/authOptions'

const { middleware, config } = createAuthMiddleware({
  clientId: identityServerConfig.clientId,
  clientSecret: identityServerConfig.clientSecret,
  redirectUriEnvVar: 'LG_PUBLIC_WEB_URL',
  fallbackRedirectUri: process.env.IDENTITY_SERVER_LOGOUT_URL as string,
  signInPath: '/skraning',
  matcherExclusions: [
    'api',
    'skraning',
    'sidur',
    '_next/static',
    '_next/image',
    'images',
    'fonts',
    '.well-known',
    'favicon.ico',
  ],
  checkIsActive: true,
})

export default middleware
export { config }

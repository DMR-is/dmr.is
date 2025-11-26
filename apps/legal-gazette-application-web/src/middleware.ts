import { createAuthMiddleware } from '@dmr.is/auth/middleware-helpers'

import { identityServerConfig } from './lib/authOptions'

const { middleware, config } = createAuthMiddleware({
  clientId: identityServerConfig.clientId,
  clientSecret: identityServerConfig.clientSecret,
  redirectUriEnvVar: 'LG_APPLICATION_WEB_URL',
  fallbackRedirectUri: process.env.IDENTITY_SERVER_LOGOUT_URL as string,
  signInPath: '/innskraning',
  matcherExclusions: [
    'api',
    'innskraning',
    '_next/static',
    '_next/image',
    'images',
    'fonts',
    '.well-known',
    'favicon.ico',
  ],
  checkIsActive: false,
})

export default middleware
export { config }

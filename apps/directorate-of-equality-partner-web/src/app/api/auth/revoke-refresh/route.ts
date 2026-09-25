import { NextRequest } from 'next/server'

import { revokeRefreshTokenHandler } from '@dmr.is/auth/revokeRefreshToken'
import { sessionCookieName } from '@dmr.is/auth/sessionCookies'

import {
  AUTH_COOKIE_PREFIX,
  identityServerConfig,
} from '../../../../lib/auth/identityServerConfig'

const handler = async (request: NextRequest) => {
  return revokeRefreshTokenHandler(
    request,
    {
      clientId: identityServerConfig.clientId,
      clientSecret: identityServerConfig.clientSecret,
    },
    sessionCookieName(AUTH_COOKIE_PREFIX),
  )
}

export { handler as GET, handler as POST }

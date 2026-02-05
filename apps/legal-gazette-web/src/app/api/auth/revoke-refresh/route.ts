import { NextRequest } from 'next/server'

import { revokeRefreshTokenHandler } from '@dmr.is/auth/revokeRefreshToken'

import { identityServerConfig } from '../../../../lib/auth/authOptions'



const handler = async (request: NextRequest) => {
  return revokeRefreshTokenHandler(request, {
    clientId: identityServerConfig.clientId,
    clientSecret: identityServerConfig.clientSecret,
  })
}

export { handler as GET, handler as POST }

import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getLogger } from '@dmr.is/logging-next'

const logger = getLogger('logout-handler')

const revokeRefreshToken = async (
  refreshToken: string,
  identityServerConfig: { clientId: string; clientSecret: string },
) => {
  const requestBody = new URLSearchParams({
    client_id: identityServerConfig.clientId,
    client_secret: identityServerConfig.clientSecret,
    token: refreshToken,
    token_type_hint: 'refresh_token',
  })
  const response = await fetch(
    `https://${process.env.IDENTITY_SERVER_DOMAIN}/connect/revocation`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: requestBody.toString(),
    },
  )

  if (!response.ok) {
    throw Error(
      `Failed to revoke refresh token: ${response.status} - ${response.statusText}`,
    )
  } else {
    logger.info('Successfully revoked refresh token')
  }
}

export const revokeRefreshTokenHandler = async (
  req: NextRequest,
  identityServerConfig: { clientId: string; clientSecret: string },
) => {
  const token = await getToken({
    req: req,
  })
  if (!token) {
    return Response.json({ message: 'No token found' }, { status: 401 })
  }
  try {
    await revokeRefreshToken(token.refreshToken as string, identityServerConfig)
  } catch (error) {
    logger.error('Error revoking refresh token', { error })
    return Response.json(
      { message: 'Error revoking refresh token' },
      { status: 500 },
    )
  }
  return Response.json(
    { message: 'Successfully revoked refresh token' },
    { status: 200 },
  )
}

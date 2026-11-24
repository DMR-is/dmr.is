import { getLogger } from '@dmr.is/logging-next'

const logger = getLogger('logout-handler')

export const revokeRefreshToken = async (
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

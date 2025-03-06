import { JWT } from 'next-auth/jwt'

import { identityServerConfig } from '../identityProvider'

export const refreshAccessToken = async (token: JWT) => {
  try {
    if (!token.refreshToken) {
      return { ...token, error: 'RefreshTokenMissing', invalid: true }
    }
    const response = await fetch(
      `https://${process.env.IDENTITY_SERVER_DOMAIN}/connect/token`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        method: 'POST',
        body: new URLSearchParams({
          client_id: identityServerConfig.clientId,
          client_secret: process.env.ISLAND_IS_DMR_WEB_CLIENT_SECRET ?? '',
          grant_type: 'refresh_token',
          redirect_uri: process.env.IDENTITY_SERVER_LOGOUT_URL ?? '',
          refresh_token: token.refreshToken,
        }),
      },
    )
    const refreshedTokens = await response.json()

    if (!response.ok) {
      throw refreshedTokens
    }
    const newTokens = refreshedTokens as {
      access_token: string
      refresh_token?: string
      expires_in: number
    }
    return {
      ...token,
      accessToken: newTokens.access_token,
      refreshToken: newTokens.refresh_token ?? token.refreshToken,
      accessTokenExpires: Math.floor(Date.now() / 1000 + newTokens.expires_in),
    }
  } catch (error) {
    return { ...token, error: 'RefreshAccessTokenError', invalid: true }
  }
}

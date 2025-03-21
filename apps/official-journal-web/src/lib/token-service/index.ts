import { JWT } from 'next-auth/jwt'
import { logger } from '@dmr.is/logging'

const LOGGING_CATEGORY = 'refreshAccessToken'

export const refreshAccessToken = async (token: JWT) => {
  try {
    if (!token.refreshToken) {
      logger.error('Refresh token missing', {
        error: 'RefreshTokenMissing',
        category: LOGGING_CATEGORY,
      })
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
          client_id: process.env.ISLAND_IS_DMR_WEB_CLIENT_ID!,
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

    const expiresIn = Math.floor(Date.now() + newTokens.expires_in * 1000)

    logger.info('Token refreshed', {
      metadata: {
        timeNow: new Date().toISOString(),
        prevExpires: new Date(token.accessTokenExpires as number).toISOString(),
        newExpires: new Date(expiresIn).toISOString(),
      },
      category: LOGGING_CATEGORY,
    })

    return {
      ...token,
      accessToken: newTokens.access_token,
      refreshToken: newTokens.refresh_token ?? token.refreshToken,
      accessTokenExpires: expiresIn,
    }
  } catch (error) {
    logger.error('Refreshing failed', {
      error: error as Error,
      category: LOGGING_CATEGORY,
    })
    return { ...token, error: 'RefreshAccessTokenError', invalid: true }
  }
}

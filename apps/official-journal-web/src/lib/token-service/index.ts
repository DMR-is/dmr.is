import { decode } from 'jsonwebtoken'

import { identityServerConfig } from '../identityProvider'

const renewalSeconds = 10

export class TokenService {
  static async refreshAccessToken(refreshToken: string): Promise<any | null> {
    try {
      const postRefresh = await fetch(
        `https://${process.env.IDENTITY_SERVER_DOMAIN}/connect/token`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: identityServerConfig.clientId,
            client_secret: process.env.ISLAND_IS_DMR_WEB_CLIENT_SECRET!,
            grant_type: 'refresh_token',
            redirect_uri: process.env.IDENTITY_SERVER_LOGOUT_URL!,
            refresh_token: refreshToken,
          }),
        },
      )

      const response = await postRefresh.json()

      return [response.access_token, response.refresh_token]
    } catch (error) {
      throw new Error(`Token refresh failed: ${JSON.stringify(error)}`)
    }
  }
}

export const checkTokenExpiry = (
  accessToken: string,
  isRefreshTokenExpired: boolean,
) => {
  try {
    const decoded = decode(accessToken)
    if (!decoded || typeof decoded === 'string' || !decoded.exp) {
      return false
    }

    if (decoded && !(typeof decoded === 'string') && decoded['exp']) {
      const expires = new Date(decoded.exp * 1000)
      // Set renewalTime few seconds before the actual time to make sure we
      // don't indicate a valid token that could expire before it is used.
      const renewalTime = new Date(expires.getTime() - renewalSeconds * 1000)

      return new Date() > renewalTime && !isRefreshTokenExpired
    }

    return false
  } catch {
    return false
  }
}

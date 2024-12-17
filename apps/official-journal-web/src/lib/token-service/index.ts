import axios from 'axios'
import { decode } from 'jsonwebtoken'
const renewalSeconds = 10
import { identityServerConfig, identityServerId } from '../identityProvider'

export class TokenService {
  static async refreshAccessToken(refreshToken: string): Promise<any | null> {
    try {
      const params = new URLSearchParams({
        client_id: identityServerConfig.clientId,
        client_secret: process.env.ISLAND_IS_DMR_WEB_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        redirect_uri: process.env.IDENTITY_SERVER_LOGOUT_URL!,
        refresh_token: refreshToken,
      })

      const response = await axios.post(
        process.env.ISLAND_IS_TOKEN_URL!,
        params.toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      )

      return [response.data.access_token, response.data.refresh_token]
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

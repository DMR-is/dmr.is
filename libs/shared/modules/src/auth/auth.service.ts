import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'

import { IAuthService } from './auth.service.interface'

type IdsTokenResponse = {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
}

@Injectable()
export class AuthService implements IAuthService {
  private accessToken: string | null = null
  private tokenExpiresAt: number | null = null

  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {
    this.logger.info('Using AuthService')
  }

  async getAccessToken() {
    const isTokenExpired =
      this.tokenExpiresAt && this.tokenExpiresAt < Date.now()

    if (!this.accessToken || isTokenExpired) {
      await this.refresh()
    }

    if (!this.accessToken) {
      throw new Error('Failed to get access token')
    }

    return this.accessToken
  }

  private async refresh() {
    const idsUrl = process.env.ISLAND_IS_TOKEN_URL
    const clientSecret = process.env.ISLAND_IS_DMR_CLIENT_SECRET
    const clientId = process.env.ISLAND_IS_DMR_CLIENT_ID
    const clientScopes = process.env.ISLAND_IS_DMR_CLIENT_SCOPES

    if (!idsUrl || !clientSecret || !clientId || !clientScopes) {
      throw new Error('Missing required environment variables')
    }

    this.logger.info('Refreshing access token')

    const tokenResponse = (await fetch(idsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
        scope: clientScopes,
      }),
    })
      .then((res) => res.json())
      .catch((err) => {
        this.logger.error('Failed to refresh access token', { err })
        throw new InternalServerErrorException('Failed to refresh access token')
      })) as IdsTokenResponse

    this.accessToken = tokenResponse.access_token
    this.tokenExpiresAt = Date.now() + tokenResponse.expires_in * 1000
  }
}

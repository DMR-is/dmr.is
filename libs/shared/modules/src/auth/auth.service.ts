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
    if (!this.accessToken) {
      this.logger.debug('Access token is missing, fetching a new one')
      await this.refresh()
    }

    if (this.isTokenExpired()) {
      this.logger.debug('Access token is expired, refreshing')
      await this.refresh()
    }

    if (!this.accessToken) {
      this.logger.error('Could not get access token')
      return null
    }

    return this.accessToken
  }

  private isTokenExpired() {
    return this.tokenExpiresAt && this.tokenExpiresAt < Date.now()
  }

  private async refresh() {
    const idsUrl = process.env.ISLAND_IS_TOKEN_URL
    const clientSecret = process.env.ISLAND_IS_DMR_CLIENT_SECRET
    const clientId = process.env.ISLAND_IS_DMR_CLIENT_ID
    const clientScopes = process.env.ISLAND_IS_DMR_CLIENT_SCOPES

    if (!idsUrl || !clientSecret || !clientId || !clientScopes) {
      this.logger.error('Missing required environment variables')
      throw new InternalServerErrorException(
        'Missing required environment variables',
      )
    }

    this.logger.info('Refreshing access token')

    const tokenResponse = await fetch(idsUrl, {
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

    if (tokenResponse.status === 200) {
      const json = await tokenResponse.json()
      if ('access_token' in json) {
        this.accessToken = json.access_token
      }

      if ('expires_in' in json) {
        this.tokenExpiresAt = Date.now() + json.expires_in * 1000
      }
    } else {
      this.logger.error('Failed to fetch access token from ids')
    }
  }
}

import { randomBytes } from 'crypto'
import { LogMethod } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { ResultWrapper } from '@dmr.is/types'

import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'

import { IAuthService, IdsToken } from './auth.service.interface'
const LOGGING_CONTEXT = 'AuthService'
const LOGGING_CATEGORY = 'auth-service'

@Injectable()
export class AuthService implements IAuthService {
  private idsToken: IdsToken | null = null
  private tokenExpiresAt: number | null = null

  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {
    this.logger.info('Using AuthService')
  }
  async getCodeVerification(): Promise<
    ResultWrapper<{
      codeChallenge: string
      codeVerifier: string
    }>
  > {
    const codeVerifier = randomBytes(32).toString('hex')

    const encoder = new TextEncoder()
    const data = encoder.encode(codeVerifier)

    const hashBuffer = await crypto.subtle.digest('SHA-256', data)

    const base64 = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)))

    return ResultWrapper.ok({
      codeVerifier,
      codeChallenge: base64,
    })
  }

  async getAccessToken() {
    if (!this.idsToken) {
      this.logger.debug('Access token is missing, fetching a new one', {
        category: LOGGING_CATEGORY,
      })
      await this.refresh()
    }

    if (this.isTokenExpired()) {
      this.logger.debug('Access token is expired, refreshing', {
        category: LOGGING_CATEGORY,
      })
      await this.refresh()
    }

    if (!this.idsToken) {
      this.logger.error('Could not get access token', {
        category: LOGGING_CATEGORY,
      })
      return null
    }

    return this.idsToken
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
      this.logger.error('Missing required environment variables', {
        category: LOGGING_CATEGORY,
        context: LOGGING_CONTEXT,
      })
      throw new InternalServerErrorException(
        'Missing required environment variables',
      )
    }

    const body = {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
      scope: clientScopes,
    }

    try {
      this.logger.info('Fetching access token from ids', {
        category: LOGGING_CATEGORY,
      })
      const tokenResponse = await fetch(idsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(body),
      })

      if (tokenResponse.status === 200) {
        const token: IdsToken = await tokenResponse.json()

        this.idsToken = token
        this.tokenExpiresAt = Date.now() + token.expires_in * 1000
      } else {
        this.logger.error('Failed to fetch access token from ids', {
          category: LOGGING_CATEGORY,
          context: LOGGING_CONTEXT,
          status: tokenResponse.status,
        })
      }
    } catch (error) {
      this.logger.error('Internal server error', {
        category: LOGGING_CATEGORY,
      })
    }
  }

  @LogMethod()
  async xroadFetch(url: string, options: RequestInit): Promise<Response> {
    const idsToken = await this.getAccessToken()

    if (!idsToken) {
      this.logger.error(
        'xroadFetch, could not get access token from auth service',
        {
          category: LOGGING_CATEGORY,
        },
      )
      throw new Error('Could not get access token from auth service')
    }

    if (!process.env.XROAD_DMR_CLIENT) {
      this.logger.error('Missing required environment', {
        category: LOGGING_CATEGORY,
      })
      throw new Error('Missing required environment')
    }

    this.logger.info(`${options.method}: ${url}`, {
      category: LOGGING_CATEGORY,
      context: LOGGING_CONTEXT,
      url: url,
    })

    const requestOption = {
      ...options,
      headers: {
        ...options.headers,
        'X-Road-Client': process.env.XROAD_DMR_CLIENT,
      },
    }

    try {
      return await fetch(url, {
        ...requestOption,
        headers: {
          Authorization: `Bearer ${idsToken.access_token}`,
          ...requestOption.headers,
        },
      })
    } catch (error) {
      this.logger.error('Failed to fetch in auth xroadFetch', {
        category: LOGGING_CATEGORY,
        context: LOGGING_CONTEXT,
        message: error instanceof Error ? error.message : String(error),
      })

      throw error
    }
  }
}

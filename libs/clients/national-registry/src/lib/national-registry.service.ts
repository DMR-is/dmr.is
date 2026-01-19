import {
  Injectable,
  Inject,
  InternalServerErrorException,
  BadGatewayException,
  ServiceUnavailableException,
} from '@nestjs/common'

import { fetchWithTimeout } from '@dmr.is/utils'
import { LOGGER_PROVIDER, Logger } from '@dmr.is/logging'

import { INationalRegistryService } from './national-registry.service.interface'
import { GetPersonDto } from './national-registry.dto'

const LOGGING_CONTEXT = 'NationalRegistryClientService'

@Injectable()
export class NationalRegistryService implements INationalRegistryService {
  private audkenni: string | null = null
  private token: string | null = null

  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {
    if (!process.env.NATIONAL_REGISTRY_API_LOGIN_PATH) {
      this.logger.error(
        'National registry login path not set in env NATIONAL_REGISTRY_API_LOGIN_PATH',
        { context: LOGGING_CONTEXT },
      )
    }

    if (!process.env.NATIONAL_REGISTRY_API_LOOKUP_PATH) {
      this.logger.error(
        'National registry lookup path not set in env NATIONAL_REGISTRY_API_LOOKUP_PATH',
        { context: LOGGING_CONTEXT },
      )
    }

    if (!process.env.NATIONAL_REGISTRY_CLIENT_USER) {
      this.logger.error(
        'National registry user not set in env NATIONAL_REGISTRY_CLIENT_USER',
        { context: LOGGING_CONTEXT },
      )

      throw new InternalServerErrorException(
        'National registry user not set in env NATIONAL_REGISTRY_CLIENT_USER',
      )
    }

    if (!process.env.NATIONAL_REGISTRY_CLIENT_PASSWORD) {
      this.logger.error(
        'National registry password not set in env NATIONAL_REGISTRY_CLIENT_PASSWORD',
        { context: LOGGING_CONTEXT },
      )

      throw new InternalServerErrorException(
        'National registry password not set in env NATIONAL_REGISTRY_CLIENT_PASSWORD',
      )
    }
  }

  private parseJsonSafely<T = any>(
    responseText: string,
    errorContext: string,
  ): T {
    try {
      return JSON.parse(responseText)
    } catch (parseError) {
      this.logger.error(`Failed to parse ${errorContext} as JSON`, {
        context: LOGGING_CONTEXT,
        parseError:
          parseError instanceof Error ? parseError.message : String(parseError),
        responseText: responseText.substring(0, 1000),
      })
      throw new BadGatewayException(
        `Failed to parse ${errorContext}: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
      )
    }
  }

  private async authenticate() {
    if (this.token && this.audkenni) {
      this.logger.info('Already authenticated with national registry', {
        context: LOGGING_CONTEXT,
      })
      return
    }

    this.logger.info('Authenticating with national registry', {
      context: LOGGING_CONTEXT,
    })

    try {
      const response = await fetchWithTimeout(
        `${process.env.NATIONAL_REGISTRY_API_LOGIN_PATH}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            notandi: process.env.NATIONAL_REGISTRY_CLIENT_USER,
            lykilord: process.env.NATIONAL_REGISTRY_CLIENT_PASSWORD,
          }),
        },
      )

      const responseText = await response.text()

      this.logger.debug('National registry authentication response', {
        context: LOGGING_CONTEXT,
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type'),
        bodyLength: responseText.length,
      })

      if (!response.ok) {
        this.logger.warning('Failed to authenticate with national registry', {
          context: LOGGING_CONTEXT,
          status: response.status,
          statusText: response.statusText,
          responseBody: responseText.substring(0, 500), // Log first 500 chars
        })

        let error: any
        try {
          error = this.parseJsonSafely(
            responseText,
            'authentication error response',
          )
        } catch (parseError) {
          throw new BadGatewayException(
            `National registry authentication failed with status ${response.status}: ${responseText.substring(0, 200)}`,
          )
        }

        this.logger.error('National registry authentication error', {
          context: LOGGING_CONTEXT,
          error,
        })

        throw new BadGatewayException(
          `National registry authentication failed: ${error.title || error.detail || 'Unknown error'}`,
        )
      }

      const data = this.parseJsonSafely(responseText, 'authentication response')

      if (!data.audkenni || !data.accessToken) {
        this.logger.error('Authentication response missing required fields', {
          context: LOGGING_CONTEXT,
          hasAudkenni: !!data.audkenni,
          hasAccessToken: !!data.accessToken,
          responseKeys: Object.keys(data),
        })
        throw new BadGatewayException(
          'National registry authentication response missing required fields',
        )
      }

      this.audkenni = data.audkenni
      this.token = data.accessToken

      this.logger.info('Successfully authenticated with national registry', {
        context: LOGGING_CONTEXT,
      })
    } catch (error) {
      this.logger.error(
        'Unexpected error during national registry authentication',
        {
          context: LOGGING_CONTEXT,
          error: error instanceof Error ? error.message : String(error),
          errorType: error?.constructor?.name,
        },
      )
      throw error
    }
  }

  async getPersonByNationalId(nationalId: string): Promise<GetPersonDto> {
    try {
      await this.authenticate()

      this.logger.info('Fetching person from national registry', {
        context: LOGGING_CONTEXT,
      })

      const response = await fetchWithTimeout(
        `${process.env.NATIONAL_REGISTRY_API_LOOKUP_PATH}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`,
          },
          body: JSON.stringify({
            audkenni: this.audkenni,
            kennitala: nationalId,
          }),
        },
      )

      const responseText = await response.text()

      this.logger.debug('National registry person lookup response', {
        context: LOGGING_CONTEXT,
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type'),
        bodyLength: responseText.length,
      })

      if (!response.ok) {
        this.logger.warning('Failed to fetch person from national registry', {
          context: LOGGING_CONTEXT,
          status: response.status,
          statusText: response.statusText,
          responseBody: responseText.substring(0, 500),
        })

        let error: any
        try {
          error = this.parseJsonSafely(
            responseText,
            'person lookup error response',
          )
        } catch (parseError) {
          // If 401, token might be expired, reset auth
          if (response.status === 401) {
            this.logger.info('Received 401, resetting authentication tokens', {
              context: LOGGING_CONTEXT,
            })
            this.token = null
            this.audkenni = null
          }

          throw new BadGatewayException(
            `National registry person lookup failed with status ${response.status}: ${responseText.substring(0, 200)}`,
          )
        }

        this.logger.error('National registry fetch person error', {
          context: LOGGING_CONTEXT,
          error,
        })

        throw new BadGatewayException(
          `National registry person lookup failed: ${error.title || error.detail || 'Unknown error'}`,
        )
      }

      const person = this.parseJsonSafely(
        responseText,
        'person lookup response',
      )

      this.logger.info('Successfully fetched person from national registry', {
        context: LOGGING_CONTEXT,
      })

      return { person }
    } catch (error) {
      this.logger.error(
        'Unexpected error during national registry person lookup',
        {
          context: LOGGING_CONTEXT,
          error: error instanceof Error ? error.message : String(error),
          errorType: error?.constructor?.name,
          stack: error instanceof Error ? error.stack : undefined,
        },
      )
      throw error
    }
  }
}

import {
  BadGatewayException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { fetchWithTimeout } from '@dmr.is/utils/server/httpUtils'

import {
  GetNationalRegistryEntityDto,
  NationalRegistryEntityDto,
} from './national-registry.dto'
import { INationalRegistryService } from './national-registry.service.interface'

const LOGGING_CONTEXT = 'NationalRegistryClientService'

interface AuthResponse {
  audkenni: string
  accessToken: string
}

interface ErrorResponse {
  title?: string
  detail?: string
}

function isAuthResponse(data: unknown): data is AuthResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'audkenni' in data &&
    typeof (data as AuthResponse).audkenni === 'string' &&
    'accessToken' in data &&
    typeof (data as AuthResponse).accessToken === 'string'
  )
}

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const err = error as ErrorResponse
    return err.title || err.detail || 'Unknown error'
  }
  return 'Unknown error'
}

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

  private parseJsonSafely<T = unknown>(
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
        this.logger.warn('Failed to authenticate with national registry', {
          context: LOGGING_CONTEXT,
          statusCode: response.status,
          statusText: response.statusText,
          responseBody: responseText.substring(0, 500), // Log first 500 chars
        })

        let error: unknown
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
          `National registry authentication failed: ${getErrorMessage(error)}`,
        )
      }

      const data = this.parseJsonSafely<unknown>(
        responseText,
        'authentication response',
      )

      if (!isAuthResponse(data)) {
        this.logger.error('Authentication response missing required fields', {
          context: LOGGING_CONTEXT,
          hasAudkenni:
            typeof data === 'object' && data !== null && 'audkenni' in data,
          hasAccessToken:
            typeof data === 'object' && data !== null && 'accessToken' in data,
          responseKeys:
            typeof data === 'object' && data !== null ? Object.keys(data) : [],
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

  async getEntityByNationalId(
    nationalId: string,
  ): Promise<GetNationalRegistryEntityDto> {
    try {
      await this.authenticate()

      this.logger.info('Fetching entity from national registry', {
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

      this.logger.debug('National registry entity lookup response', {
        context: LOGGING_CONTEXT,
        statusCode: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type'),
        bodyLength: responseText.length,
      })

      if (!response.ok) {
        this.logger.warn('Failed to fetch entity from national registry', {
          context: LOGGING_CONTEXT,
          statusCode: response.status,
          statusText: response.statusText,
          responseBody: responseText.substring(0, 500),
        })

        let error: unknown
        try {
          error = this.parseJsonSafely(
            responseText,
            'entity lookup error response',
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
            `National registry entity lookup failed with status ${response.status}: ${responseText.substring(0, 200)}`,
          )
        }

        this.logger.error('National registry fetch entity error', {
          context: LOGGING_CONTEXT,
          error,
        })

        throw new BadGatewayException(
          `National registry entity lookup failed: ${getErrorMessage(error)}`,
        )
      }

      const entity = this.parseJsonSafely<NationalRegistryEntityDto | null>(
        responseText,
        'entity lookup response',
      )

      this.logger.info('Successfully fetched entity from national registry', {
        context: LOGGING_CONTEXT,
      })

      return { entity }
    } catch (error) {
      this.logger.error(
        'Unexpected error during national registry entity lookup',
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

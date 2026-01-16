import { Injectable, Inject } from '@nestjs/common'

import { fetchWithTimeout } from '@dmr.is/utils'
import { LOGGER_PROVIDER, Logger } from '@dmr.is/logging'

import { INationalRegistryService } from './national-registry.service.interface'
import { GetPersonDto, NationalRegistryError } from './national-registry.dto'

const LOGGING_CONTEXT = 'NationalRegistryClientService'

@Injectable()
export class NationalRegistryService implements INationalRegistryService {
  private audkenni: string | null = null
  private token: string | null = null

  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {
    if (!process.env.NATIONAL_REGISTRY_API_LOGIN_PATH) {
      console.error(
        'National registry login path not set in env NATIONAL_REGISTRY_API_LOGIN_PATH',
      )
    }

    if (!process.env.NATIONAL_REGISTRY_API_LOOKUP_PATH) {
      console.error(
        'National registry lookup path not set in env NATIONAL_REGISTRY_API_LOOKUP_PATH',
      )
    }

    if (!process.env.NATIONAL_REGISTRY_CLIENT_USER) {
      console.error(
        'National registry user not set in env NATIONAL_REGISTRY_CLIENT_USER',
      )

      throw new Error(
        'National registry user not set in env NATIONAL_REGISTRY_CLIENT_USER',
      )
    }

    if (!process.env.NATIONAL_REGISTRY_CLIENT_PASSWORD) {
      console.error(
        'National registry password not set in env NATIONAL_REGISTRY_CLIENT_PASSWORD',
      )

      throw new Error(
        'National registry password not set in env NATIONAL_REGISTRY_CLIENT_PASSWORD',
      )
    }
  }

  private async authenticate() {
    if (this.token && this.audkenni) {
      this.logger.debug('Already authenticated with national registry', {
        context: LOGGING_CONTEXT,
      })
      return
    }

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

    if (!response.ok) {
      this.logger.warning('Failed to authenticate with national registry', {
        context: LOGGING_CONTEXT,
        status: response.status,
      })
      const error = await response.json()

      this.logger.error('National registry authentication error', {
        context: LOGGING_CONTEXT,
        error,
      })

      throw new NationalRegistryError({
        type: error.type,
        title: error.title,
        status: error.status,
        detail: error.detail,
      })
    }

    const data = await response.json()

    this.audkenni = data.audkenni
    this.token = data.accessToken
  }

  async getPersonByNationalId(nationalId: string): Promise<GetPersonDto> {
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

    if (!response.ok) {
      this.logger.warning('Failed to fetch person from national registry', {
        context: LOGGING_CONTEXT,
        status: response.status,
      })
      const error = await response.json()

      this.logger.error('National registry fetch person error', {
        context: LOGGING_CONTEXT,
        error,
      })

      throw new NationalRegistryError({
        type: error.type,
        title: error.title,
        status: error.status,
        detail: error.detail,
      })
    }

    const person = await response.json()

    return { person }
  }
}

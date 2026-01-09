import { Injectable } from '@nestjs/common'

import { fetchWithTimeout } from '@dmr.is/utils'

import { INationalRegistryService } from './national-registry.service.interface'
import { GetPersonDto, NationalRegistryError } from './national-registry.dto'

@Injectable()
export class NationalRegistryService implements INationalRegistryService {
  private audkenni: string | null = null
  private token: string | null = null

  constructor() {
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
      const error = await response.json()

      console.error(error)

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
      const error = await response.json()

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

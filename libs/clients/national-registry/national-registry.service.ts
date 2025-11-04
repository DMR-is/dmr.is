import { Injectable } from '@nestjs/common'
import { INationalRegistryService } from './national-registry.service.interface'
import { GetPersonDto } from './national-registry.dto'

@Injectable()
export class NationalRegistryService implements INationalRegistryService {
  private audkenni: string | null = null
  private token: string | null = null

  constructor() {
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

    const repsonse = await fetch(
      'https://api.syslumenn.is/staging/v1/Innskraning',
      {
        method: 'POST',
        body: JSON.stringify({
          notandi: process.env.NATIONAL_REGISTRY_CLIENT_USER,
          lykilord: process.env.NATIONAL_REGISTRY_CLIENT_PASSWORD,
        }),
      },
    )

    if (!repsonse.ok) {
      console.error(
        `National registry authentication failed with status ${repsonse.status}`,
      )
      throw new Error('National registry authentication failed')
    }

    const data = await repsonse.json()

    this.audkenni = data.audkenni
    this.token = data.token
  }

  async getPersonByNationalId(nationalId: string): Promise<GetPersonDto> {
    await this.authenticate()

    const response = await fetch(
      'https://api.syslumenn.is/api/api/LeitaAdKennitoluIThjodskra',
      {
        method: 'POST',
        body: JSON.stringify({
          audkenni: this.audkenni,
          kennitala: nationalId,
        }),
      },
    )

    if (!response.ok) {
      console.error(
        `National registry getPersonByNationalId failed with status ${response.status}`,
      )
      throw new Error('National registry getPersonByNationalId failed')
    }

    const person = await response.json()

    return { person }
  }
}

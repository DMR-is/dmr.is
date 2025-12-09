import { GetCompanyDto } from './company-registry.dto'
import { ICompanyRegistryClientService } from './company-registry.service.interface'

export class CompanyRegistryClientService
  implements ICompanyRegistryClientService
{
  private baseUrl = 'https://api.skattur.cloud/legalentities/v2'

  async getCompany(nationalId: string): Promise<GetCompanyDto> {
    const response = await fetch(`${this.baseUrl}/${nationalId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Error fetching company data: ${response.statusText}`)
    }

    const legalEntity = await response.json()

    return { legalEntity }
  }
}

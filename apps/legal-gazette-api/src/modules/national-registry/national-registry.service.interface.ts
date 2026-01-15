import { GetCompanyDto } from '@dmr.is/clients/company-registry'
import { GetPersonDto } from '@dmr.is/clients/national-registry'

export interface ILGNationalRegistryService {
  getPersonByNationalId(nationalId: string): Promise<GetPersonDto>
  getCompanyByNationalId(nationalId: string): Promise<GetCompanyDto>
  getEntityNameByNationalId(nationalId: string): Promise<string>
}

export const ILGNationalRegistryService = Symbol('ILGNationalRegistryService')

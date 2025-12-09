import { GetCompanyDto } from './company-registry.dto'

export interface ICompanyRegistryClientService {
  getCompany(nationalId: string): Promise<GetCompanyDto>
}

export const ICompanyRegistryClientService = Symbol(
  'ICompanyRegistryClientService',
)

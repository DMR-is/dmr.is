import { CompanyDto } from './dto/company.dto'

export interface ICompanyService {
  getByNationalId(nationalId: string): Promise<CompanyDto>
}

export const ICompanyService = Symbol('ICompanyService')

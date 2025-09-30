import { RegisterCompanyDto } from './dto/company.dto'

export interface ICompanyService {
  registerCompany(body: RegisterCompanyDto): Promise<void>
}

export const ICompanyService = 'ICompanyService'

import {
  RegisterCompanyHlutafelagDto,
  RegisterCompanyFirmaskraDto,
} from './dto/company.dto'

export interface ICompanyService {
  registerCompanyHlutafelag(body: RegisterCompanyHlutafelagDto): Promise<void>

  registerCompanyFirmaskra(body: RegisterCompanyFirmaskraDto): Promise<void>
}

export const ICompanyService = 'ICompanyService'

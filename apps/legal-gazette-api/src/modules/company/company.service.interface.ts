import {
  CreateAdditionalAnnouncementsDto,
  RegisterCompanyDto,
} from './dto/company.dto'

export interface ICompanyService {
  registerCompany(body: RegisterCompanyDto): Promise<void>

  createAdditionalAnnouncements(
    body: CreateAdditionalAnnouncementsDto,
  ): Promise<void>
}

export const ICompanyService = 'ICompanyService'

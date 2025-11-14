import {
  CreateAdditionalAnnouncementsDto,
  RegisterCompanyFirmaskraDto,
  RegisterCompanyHlutafelagDto,
} from '../external-systems.dto'

export interface ICompanyService {
  registerCompanyHlutafelag(body: RegisterCompanyHlutafelagDto): Promise<void>

  registerCompanyFirmaskra(body: RegisterCompanyFirmaskraDto): Promise<void>

  createAdditionalAnnouncements(
    body: CreateAdditionalAnnouncementsDto,
  ): Promise<void>
}

export const ICompanyService = 'ICompanyService'

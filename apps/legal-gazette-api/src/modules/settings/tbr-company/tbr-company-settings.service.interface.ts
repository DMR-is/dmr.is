import {
  CreateTBRCompanySettingsDto,
  GetTBRCompanySettingsQueryDto,
  TBRCompanySettingsItemDto,
  TBRCompanySettingsListDto,
  UpdateTbrCompanySettingsDto,
} from '../../../models/tbr-company-settings.model'

export interface ITBRCompanySettingsService {
  getSettings(
    query: GetTBRCompanySettingsQueryDto,
  ): Promise<TBRCompanySettingsListDto>
  markAsActive(id: string): Promise<void>
  markAsInactive(id: string): Promise<void>
  deleteSetting(id: string): Promise<void>
  createSetting(
    body: CreateTBRCompanySettingsDto,
  ): Promise<TBRCompanySettingsItemDto>
  updateSetting(
    id: string,
    body: UpdateTbrCompanySettingsDto,
  ): Promise<TBRCompanySettingsItemDto>
}

export const ITBRCompanySettingsService = Symbol('ITBRCompanySettingsService')

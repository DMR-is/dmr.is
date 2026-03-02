import {
  TBRCompanySettingsItemDto,
} from '../../../models/tbr-company-settings.model'
import {
  CreateTBRCompanySettingsDto,
  GetTBRCompanySettingsQueryDto,
  TBRCompanySettingsListDto,
  UpdateTbrCompanySettingsDto,
} from './dto/tbr-company-settings.dto'

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

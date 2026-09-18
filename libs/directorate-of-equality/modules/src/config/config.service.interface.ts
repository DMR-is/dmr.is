import { ConfigDto, UpdateConfigDto } from './dto/config.dto'

export interface IConfigService {
  getAll(): Promise<ConfigDto[]>
  getByKey(key: string): Promise<ConfigDto>
  getHistoryByKey(key: string): Promise<ConfigDto[]>
  updateByKey(key: string, dto: UpdateConfigDto): Promise<ConfigDto>
}

export const IConfigService = Symbol('IConfigService')

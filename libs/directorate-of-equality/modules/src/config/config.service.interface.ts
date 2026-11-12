import { ConfigDto, UpdateConfigDto } from './dto/config.dto'

export interface IConfigService {
  getAll(): Promise<ConfigDto[]>
  getByKey(key: string): Promise<ConfigDto>
  getHistoryByKey(key: string): Promise<ConfigDto[]>
  /**
   * Supersedes the active row with a new value. `actorUserId` is the admin
   * making the change, logged with the key, since the row records when but
   * not who.
   */
  updateByKey(
    key: string,
    dto: UpdateConfigDto,
    actorUserId?: string,
  ): Promise<ConfigDto>
}

export const IConfigService = Symbol('IConfigService')

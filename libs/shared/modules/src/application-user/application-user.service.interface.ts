import { ApplicationUser } from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

export interface IApplicationUserService {
  getUser(nationalId: string): Promise<ResultWrapper<{ user: ApplicationUser }>>
}

export const IApplicationUserService = Symbol('IApplicationUserService')

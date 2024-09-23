import { ApplicationUser, Institution } from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

export interface IApplicationUserService {
  getUser(nationalId: string): Promise<ResultWrapper<{ user: ApplicationUser }>>

  getUserInvolvedParties(
    nationalId: string,
  ): Promise<ResultWrapper<{ involvedParties: Institution[] }>>
}

export const IApplicationUserService = Symbol('IApplicationUserService')

import { ApplicationUser, Institution } from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

export interface IApplicationUserService {
  checkIfUserHasInvolvedParty(
    nationalId: string,
    institutionId: string,
  ): Promise<ResultWrapper<{ hasInvolvedParty: boolean }>>

  getUser(nationalId: string): Promise<ResultWrapper<{ user: ApplicationUser }>>

  getUserFromToken(
    token?: string,
  ): Promise<ResultWrapper<{ user: ApplicationUser }>>

  getUserInvolvedParties(
    nationalId: string,
  ): Promise<ResultWrapper<{ involvedParties: Institution[] }>>
}

export const IApplicationUserService = Symbol('IApplicationUserService')

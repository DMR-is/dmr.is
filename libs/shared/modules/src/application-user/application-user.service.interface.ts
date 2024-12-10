import {
  ApplicationUserQuery,
  GetApplicationUser,
  GetApplicationUsers,
  Institution,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

export interface IApplicationUserService {
  checkIfUserHasInvolvedParty(
    nationalId: string,
    institutionId: string,
  ): Promise<ResultWrapper<{ hasInvolvedParty: boolean }>>

  getUsers(
    query: ApplicationUserQuery,
  ): Promise<ResultWrapper<GetApplicationUsers>>

  getUser(nationalId: string): Promise<ResultWrapper<GetApplicationUser>>

  getUserInvolvedParties(
    nationalId: string,
  ): Promise<ResultWrapper<{ involvedParties: Institution[] }>>
}

export const IApplicationUserService = Symbol('IApplicationUserService')

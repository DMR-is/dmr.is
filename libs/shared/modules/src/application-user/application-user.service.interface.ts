import {
  ApplicationUserQuery,
  CreateApplicationUser,
  GetApplicationUser,
  GetApplicationUsers,
  Institution,
  UpdateApplicationUser,
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

  createUser(
    body: CreateApplicationUser,
  ): Promise<ResultWrapper<GetApplicationUser>>

  updateUser(
    id: string,
    body: UpdateApplicationUser,
  ): Promise<ResultWrapper<GetApplicationUser>>

  deleteUser(id: string): Promise<ResultWrapper>
}

export const IApplicationUserService = Symbol('IApplicationUserService')

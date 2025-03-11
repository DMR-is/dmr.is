import {
  GetInvoledPartiesByUserResponse,
  GetRolesByUserResponse,
  GetUserResponse,
  GetUsersQuery,
  GetUsersResponse,
  UserDto,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

export interface IUserService {
  getUsers(
    query: GetUsersQuery,
    currentUser: UserDto,
  ): Promise<ResultWrapper<GetUsersResponse>>

  getUsersByUserInvolvedParties(
    query: GetUsersQuery,
    currentUser: UserDto,
  ): Promise<ResultWrapper<GetUsersResponse>>

  getUserByNationalId(
    nationalId: string,
  ): Promise<ResultWrapper<GetUserResponse>>

  getRolesByUser(
    currentUser: UserDto,
  ): Promise<ResultWrapper<GetRolesByUserResponse>>

  getInvolvedPartiesByUser(
    currentUser: UserDto,
  ): Promise<ResultWrapper<GetInvoledPartiesByUserResponse>>
}

export const IUserService = Symbol('IUserService')

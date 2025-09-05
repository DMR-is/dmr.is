import {
  CreateUserDto,
  GetInvoledPartiesByUserResponse,
  GetInvoledPartyByNationalIdResponse,
  GetMyUserInfoResponse,
  GetRolesByUserResponse,
  GetUserResponse,
  GetUsersQuery,
  GetUsersResponse,
  UpdateUserDto,
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

  getInvolvedPartyByNationalId(
    nationalId: string,
    name?: string,
  ): Promise<ResultWrapper<GetInvoledPartyByNationalIdResponse>>

  getRolesByUser(
    currentUser: UserDto,
  ): Promise<ResultWrapper<GetRolesByUserResponse>>

  getInvolvedPartiesByUser(
    currentUser: UserDto,
  ): Promise<ResultWrapper<GetInvoledPartiesByUserResponse>>

  getMyUserInfo(
    currentUser: UserDto,
  ): Promise<ResultWrapper<GetMyUserInfoResponse>>

  createUser(
    body: CreateUserDto,
    currentUser: UserDto,
  ): Promise<ResultWrapper<GetUserResponse>>

  createUserFromInvolvedParty(
    body: {
      name: string
      nationalId: string
    },
    involvedPartyId: string,
  ): Promise<ResultWrapper<GetUserResponse>>
  updateUser(
    userId: string,
    body: UpdateUserDto,
    currentUser: UserDto,
  ): Promise<ResultWrapper<GetUserResponse>>
  deleteUser(userId: string, currentUser: UserDto): Promise<ResultWrapper>
  associateUserToInvolvedParty(
    userId: string,
    involvedPartyId: string,
  ): Promise<ResultWrapper>
}

export const IUserService = Symbol('IUserService')

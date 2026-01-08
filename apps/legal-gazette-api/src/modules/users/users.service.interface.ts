import { DMRUser } from '@dmr.is/auth/dmrUser'
import { PagingQuery } from '@dmr.is/shared/dto'

import {
  CreateUserDto,
  GetUsersResponse,
  GetUsersWithPagingResponse,
  UpdateUserDto,
  UserDto,
} from '../../models/users.model'

export interface IUsersService {
  getUserByNationalId(nationalId: string): Promise<UserDto>

  getEmployees(): Promise<GetUsersResponse>

  getUsers(query: PagingQuery): Promise<GetUsersWithPagingResponse>

  createUser(body: CreateUserDto, user: DMRUser): Promise<UserDto>

  deleteUser(userId: string, user: DMRUser): Promise<void>
  updateUser(
    userId: string,
    body: UpdateUserDto,
    user: DMRUser,
  ): Promise<UserDto>
}

export const IUsersService = Symbol('IUsersService')

import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'
import { PagingQuery } from '@dmr.is/shared-dto'

import { UserDto } from '../../models/users.model'
import {
  CreateUserDto,
  GetUsersResponse,
  GetUsersWithPagingResponse,
  UpdateUserDto,
} from './dto/users.dto'

export interface IUsersService {
  getUserByNationalId(nationalId: string, paranoid?: boolean): Promise<UserDto>

  getEmployees(): Promise<GetUsersResponse>

  getUsers(query: PagingQuery): Promise<GetUsersWithPagingResponse>

  createUser(body: CreateUserDto, user: DMRUser): Promise<UserDto>

  deleteUser(userId: string, user: DMRUser): Promise<void>
  updateUser(
    userId: string,
    body: UpdateUserDto,
    user: DMRUser,
  ): Promise<UserDto>

  restoreUser(nationalId: string, user: DMRUser): Promise<UserDto>
}

export const IUsersService = Symbol('IUsersService')

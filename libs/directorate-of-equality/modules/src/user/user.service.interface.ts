import { CreateUserBodyDto } from './dto/create-user.body.dto'
import { GetUsersQueryDto } from './dto/get-users.query.dto'
import { UpdateUserBodyDto } from './dto/update-user.body.dto'
import { UserDto } from './dto/user.dto'
import { UserLookupDto } from './dto/user-lookup.dto'

export interface IUserService {
  getMyUser(nationalId: string): Promise<UserDto>
  getUsers(query: GetUsersQueryDto): Promise<UserDto[]>
  /**
   * The person the national registry has for a kennitala, to pre-fill a new
   * user. `400` for an invalid or a company kennitala, `404` when the
   * registry has no one. An existing user is answered from our own table,
   * without asking the registry.
   */
  lookupNationalRegistry(nationalId: string): Promise<UserLookupDto>
  createUser(input: CreateUserBodyDto): Promise<UserDto>
  updateUser(
    id: string,
    input: UpdateUserBodyDto,
    actorId: string,
  ): Promise<UserDto>
  softDeleteUser(id: string, actorId: string): Promise<void>
}

export const IUserService = Symbol('IUserService')

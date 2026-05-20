import { CreateUserBodyDto } from './dto/create-user.body.dto'
import { GetUsersQueryDto } from './dto/get-users.query.dto'
import { UpdateUserBodyDto } from './dto/update-user.body.dto'
import { UserDto } from './dto/user.dto'

export interface IUserService {
  getMyUser(nationalId: string): Promise<UserDto>
  getUsers(query: GetUsersQueryDto): Promise<UserDto[]>
  createUser(input: CreateUserBodyDto): Promise<UserDto>
  updateUser(
    id: string,
    input: UpdateUserBodyDto,
    actorId: string,
  ): Promise<UserDto>
  softDeleteUser(id: string, actorId: string): Promise<void>
}

export const IUserService = Symbol('IUserService')

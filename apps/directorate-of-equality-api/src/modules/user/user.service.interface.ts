import { GetUsersQueryDto } from './dto/get-users.query.dto'
import { UserDto } from './dto/user.dto'

export interface IUserService {
  getMyUser(nationalId: string): Promise<UserDto>
  getUsers(query: GetUsersQueryDto): Promise<UserDto[]>
}

export const IUserService = Symbol('IUserService')

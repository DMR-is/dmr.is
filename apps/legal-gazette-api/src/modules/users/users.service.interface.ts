import { UserDto } from './dto/user.dto'

export interface IUsersService {
  getUserByNationalId(nationalId: string): Promise<UserDto>
}

export const IUsersService = Symbol('IUsersService')

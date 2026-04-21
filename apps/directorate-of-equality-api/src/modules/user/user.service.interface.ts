import { UserDto } from './dto/user.dto'

export interface IUserService {
  getMyUser(nationalId: string): Promise<UserDto>
}

export const IUserService = Symbol('IUserService')

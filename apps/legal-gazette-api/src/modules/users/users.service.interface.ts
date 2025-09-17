import { GetUsersResponse, UserDto } from './dto/user.dto'

export interface IUsersService {
  getUserByNationalId(nationalId: string): Promise<UserDto>

  getEmployees(): Promise<GetUsersResponse>
}

export const IUsersService = Symbol('IUsersService')

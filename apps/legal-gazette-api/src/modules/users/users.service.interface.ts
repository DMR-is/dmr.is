import { GetUsersResponse, UserDto } from '../../models/users.model'

export interface IUsersService {
  getUserByNationalId(nationalId: string): Promise<UserDto>

  getEmployees(): Promise<GetUsersResponse>
}

export const IUsersService = Symbol('IUsersService')

import { GetUsersResponse, UserDto } from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

export interface IUserService {
  getUsers(user: UserDto): Promise<ResultWrapper<GetUsersResponse>>
}

export const IUserService = Symbol('IUserService')

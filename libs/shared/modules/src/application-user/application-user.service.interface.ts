import { ResultWrapper } from '@dmr.is/types'

export interface IUserService {
  getUser(nationalId: string): Promise<ResultWrapper>
}

export const IUserService = Symbol('IUserService')

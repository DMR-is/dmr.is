import {
  CreateCaseDto,
  CreateCaseResponseDto,
  GetCaseResponse,
  GetCasesQuery,
  GetCasesReponse,
} from '@dmr.is/official-journal/dto/case/case.dto'
import { UserDto } from '@dmr.is/official-journal/dto/user/user.dto'
import { ResultWrapper } from '@dmr.is/types'

export interface ICaseService {
  getCase(id: string): Promise<ResultWrapper<GetCaseResponse>>
  getCases(params?: GetCasesQuery): Promise<ResultWrapper<GetCasesReponse>>

  createCase(
    body: CreateCaseDto,
    currentUser: UserDto,
  ): Promise<ResultWrapper<CreateCaseResponseDto>>
}

export const ICaseService = Symbol('ICaseService')

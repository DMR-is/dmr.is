import {
  CreateCaseDto,
  CreateCaseResponseDto,
  GetCaseResponse,
  GetCasesQuery,
  GetCasesReponse,
  UpdateCaseBody,
  UpdateCaseCategoriesBody,
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

  updateCase(
    caseId: string,
    body: UpdateCaseBody,
    currentUser: UserDto,
  ): Promise<ResultWrapper<GetCaseResponse>>

  updateCaseCategories(
    caseId: string,
    body: UpdateCaseCategoriesBody,
  ): Promise<ResultWrapper>
}

export const ICaseService = Symbol('ICaseService')

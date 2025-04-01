import {
  CreateCaseDto,
  CreateCaseResponseDto,
  GetCaseResponse,
  GetCasesQuery,
  GetCasesReponse,
} from '@dmr.is/official-journal/dto/case/case.dto'

export interface ICaseService {
  getCase(id: string): Promise<GetCaseResponse>
  getCases(params?: GetCasesQuery): Promise<GetCasesReponse>

  createCase(body: CreateCaseDto): Promise<CreateCaseResponseDto>
}

export const ICaseService = Symbol('ICaseService')

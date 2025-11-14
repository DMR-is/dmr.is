import {
  CaseDto,
  CaseQueryDto,
  CreateCaseDto,
  GetCasesDto,
} from '../../models/case.model'

export interface ICaseService {
  getCases(query: CaseQueryDto): Promise<GetCasesDto>

  createCase(body: CreateCaseDto): Promise<CaseDto>

  deleteCase(id: string): Promise<void>

  restoreCase(id: string): Promise<CaseDto>
}

export const ICaseService = Symbol('ICaseService')

import { CaseDto, CaseQueryDto, GetCasesDto } from './dto/case.dto'

export interface ICaseService {
  getCases(query: CaseQueryDto): Promise<GetCasesDto>

  getCase(id: string): Promise<CaseDto>

  deleteCase(id: string): Promise<void>

  restoreCase(id: string): Promise<CaseDto>
}

export const ICaseService = Symbol('ICaseService')

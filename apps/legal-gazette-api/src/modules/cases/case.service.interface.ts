import { CaseDto, GetCasesDto } from './dto/case.dto'

export interface ICaseService {
  getCases(): Promise<GetCasesDto>

  getCase(id: string): Promise<CaseDto>
}

export const ICaseService = Symbol('ICaseService')

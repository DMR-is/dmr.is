import { CaseDto, GetCasesDto } from './dto/case.dto'

export interface ICaseService {
  create(body: any): void

  createCommonCase(body: any): void

  getCases(): Promise<GetCasesDto>

  getCase(id: string): Promise<CaseDto>
}

export const ICaseService = Symbol('ICaseService')

import { Case, CasesReponse, CasesQuery } from '@dmr.is/shared/dto/cases'

export interface ICaseService {
  getCase(id: string): Promise<Case | null>

  getCases(params?: CasesQuery): Promise<CasesReponse>
}

export const ICaseService = Symbol('ICaseService')

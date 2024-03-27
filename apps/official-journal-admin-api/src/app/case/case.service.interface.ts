import {
  Case,
  GetCasesReponse,
  GetCasesQuery,
  CaseEditorialOverview,
} from '@dmr.is/shared/dto'

export interface ICaseService {
  getCase(id: string): Promise<Case | null>

  getCases(params?: GetCasesQuery): Promise<GetCasesReponse>

  getEditorialOverview(params?: GetCasesQuery): Promise<CaseEditorialOverview>
}

export const ICaseService = Symbol('ICaseService')

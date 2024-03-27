import { Case, GetCasesReponse, GetCasesQuery } from '@dmr.is/shared/dto'

export interface ICaseService {
  getCase(id: string): Promise<Case | null>

  getCases(params?: CasesQuery): Promise<CasesReponse>

  getEditorialOverview(params?: CasesQuery): Promise<CaseOverviewResponse>
}

export const ICaseService = Symbol('ICaseService')

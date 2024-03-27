import { Case, GetCasesQuery, GetCasesReponse } from '@dmr.is/shared/dto'

export interface ICaseService {
  getCase(id: string): Promise<Case | null>

  getCases(params?: GetCasesQuery): Promise<GetCasesReponse>
}

export const ICaseService = Symbol('ICaseService')

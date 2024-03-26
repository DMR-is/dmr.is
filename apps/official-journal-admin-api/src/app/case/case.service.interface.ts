import { Case } from '../../dto/case/case.dto'
import { CasesQuery } from '../../dto/case/cases-query.dto'
import { CasesReponse } from '../../dto/case/cases-response'

export interface ICaseService {
  getCase(id: string): Promise<Case | null>

  getCases(params?: CasesQuery): Promise<CasesReponse>
}

export const ICaseService = Symbol('ICaseService')

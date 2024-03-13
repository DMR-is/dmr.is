import { Case } from '../../dto/case/case.dto'
import { CasesReponse } from '../../dto/case/cases-response'

export interface ICaseService {
  getCase(id: string): Promise<Case | null>

  getCases(): Promise<CasesReponse>
}

export const ICaseService = Symbol('ICaseService')

import { Case } from '../../dto/case/case.dto'

export interface ICaseService {
  getCase(id: string): Promise<Case | null>
}

export const ICaseService = Symbol('ICaseService')

import { CaseWithAdvert } from '@dmr.is/shared/dto'

import { Result } from '../types/result'

export interface IUtilityService {
  getCaseWithAdvert(caseId: string): Promise<Result<CaseWithAdvert | null>>
}

export const IUtilityService = Symbol('IUtilityService')

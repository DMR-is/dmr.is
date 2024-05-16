import { CaseWithAdvert } from '@dmr.is/shared/dto'

export interface IUtilityService {
  getCaseWithAdvert(caseId: string): Promise<CaseWithAdvert>
}

export const IUtilityService = Symbol('IUtilityService')

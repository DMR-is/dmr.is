import { CaseWithAdvert } from '@dmr.is/shared/dto'

import {
  CaseCommunicationStatusDto,
  CaseDto,
  CaseStatusDto,
} from '../case/models'
import { AdvertDepartmentDTO } from '../journal/models'
import { Result } from '../types/result'

export interface IUtilityService {
  getCaseWithAdvert(caseId: string): Promise<Result<CaseWithAdvert | null>>
  departmentLookup(departmentId: string): Promise<Result<AdvertDepartmentDTO>>
  caseLookup(caseId: string): Promise<Result<CaseDto>>
  generateCaseNumber(): Promise<Result<string>>
  caseStatusLookup(status: string): Promise<Result<CaseStatusDto>>
  caseTagLookup(tag: string): Promise<Result<CaseStatusDto>>
  caseCommunicationStatusLookup(
    status: string,
  ): Promise<Result<CaseCommunicationStatusDto>>
  caseLookupByApplicationId(advertId: string): Promise<Result<CaseDto>>
}

export const IUtilityService = Symbol('IUtilityService')

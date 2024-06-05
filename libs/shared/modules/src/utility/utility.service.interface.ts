import { CaseWithAdvert, User } from '@dmr.is/shared/dto'

import {
  CaseCommunicationStatusDto,
  CaseDto,
  CaseStatusDto,
} from '../case/models'
import { AdvertDepartmentDTO, AdvertTypeDTO } from '../journal/models'
import { Result } from '../types/result'

export interface IUtilityService {
  getCaseWithAdvert(caseId: string): Promise<Result<CaseWithAdvert>>
  departmentLookup(departmentId: string): Promise<Result<AdvertDepartmentDTO>>
  typeLookup(type: string): Promise<Result<AdvertTypeDTO>>
  caseLookup(caseId: string): Promise<Result<CaseDto>>
  generateCaseNumber(): Promise<Result<string>>
  caseStatusLookup(status: string): Promise<Result<CaseStatusDto>>
  caseTagLookup(tag: string): Promise<Result<CaseStatusDto>>
  caseCommunicationStatusLookup(
    status: string,
  ): Promise<Result<CaseCommunicationStatusDto>>
  caseLookupByApplicationId(advertId: string): Promise<Result<CaseDto>>

  userLookup(userId: string): Promise<Result<User>>
}

export const IUtilityService = Symbol('IUtilityService')

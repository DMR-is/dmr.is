import { Transaction } from 'sequelize'
import { CaseWithAdvert, User } from '@dmr.is/shared/dto'
import { Result } from '@dmr.is/types'

import {
  CaseCommunicationStatusDto,
  CaseDto,
  CaseStatusDto,
} from '../case/models'
import {
  AdvertCategoryDTO,
  AdvertDepartmentDTO,
  AdvertTypeDTO,
} from '../journal/models'

export interface IUtilityService {
  getCaseWithAdvert(caseId: string): Promise<Result<CaseWithAdvert>>
  departmentLookup(departmentId: string): Promise<Result<AdvertDepartmentDTO>>
  typeLookup(type: string): Promise<Result<AdvertTypeDTO>>
  categoryLookup(categoryId: string): Promise<Result<AdvertCategoryDTO>>
  caseLookup(
    caseId: string,
    transaction?: Transaction,
  ): Promise<Result<CaseDto>>
  generateCaseNumber(): Promise<Result<string>>
  caseStatusLookup(status: string): Promise<Result<CaseStatusDto>>
  caseTagLookup(tag: string): Promise<Result<CaseStatusDto>>
  caseCommunicationStatusLookup(
    status: string,
  ): Promise<Result<CaseCommunicationStatusDto>>
  caseLookupByApplicationId(advertId: string): Promise<Result<CaseDto>>

  userLookup(userId: string): Promise<Result<User>>

  getNextSerialNumber(
    departmentId: string,
    year: number,
  ): Promise<Result<number>>
}

export const IUtilityService = Symbol('IUtilityService')

import { Transaction } from 'sequelize'
import { CaseWithAdvert, User } from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import {
  CaseCommunicationStatusDto,
  CaseDto,
  CaseStatusDto,
} from '../case/models'
import {
  AdvertCategoryDTO,
  AdvertDepartmentDTO,
  AdvertStatusDTO,
  AdvertTypeDTO,
} from '../journal/models'

export interface IUtilityService {
  getCaseWithAdvert(caseId: string): Promise<ResultWrapper<CaseWithAdvert>>
  advertStatusLookup(status: string): Promise<ResultWrapper<AdvertStatusDTO>>
  departmentLookup(
    departmentId: string,
  ): Promise<ResultWrapper<AdvertDepartmentDTO>>
  typeLookup(type: string): Promise<ResultWrapper<AdvertTypeDTO>>
  categoryLookup(categoryId: string): Promise<ResultWrapper<AdvertCategoryDTO>>
  caseLookup(
    caseId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CaseDto>>
  generateCaseNumber(): Promise<ResultWrapper<string>>
  caseStatusLookup(status: string): Promise<ResultWrapper<CaseStatusDto>>
  caseTagLookup(tag: string): Promise<ResultWrapper<CaseStatusDto>>
  caseCommunicationStatusLookup(
    status: string,
  ): Promise<ResultWrapper<CaseCommunicationStatusDto>>
  caseLookupByApplicationId(advertId: string): Promise<ResultWrapper<CaseDto>>

  userLookup(userId: string): Promise<ResultWrapper<User>>

  getNextCaseNumber(
    departmentId: string,
    year: number,
  ): Promise<ResultWrapper<number>>

  getNextPublicationNumber(
    departmentId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<number>>
}

export const IUtilityService = Symbol('IUtilityService')

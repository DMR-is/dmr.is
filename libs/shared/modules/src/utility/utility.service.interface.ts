import { Transaction } from 'sequelize'
import { GetApplicationResponse, User } from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import {
  CaseCommunicationStatusModel,
  CaseModel,
  CaseStatusModel,
  CaseTagModel,
} from '../case/models'
import {
  AdvertCategoryModel,
  AdvertDepartmentModel,
  AdvertInvolvedPartyModel,
  AdvertStatusModel,
  AdvertTypeModel,
} from '../journal/models'

export interface IUtilityService {
  approveApplication(applicationId: string): Promise<ResultWrapper>

  rejectApplication(applicationId: string): Promise<ResultWrapper>
  applicationLookup(
    applicationId: string,
  ): Promise<ResultWrapper<GetApplicationResponse>>
  advertStatusLookup(status: string): Promise<ResultWrapper<AdvertStatusModel>>
  departmentLookup(
    departmentId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<AdvertDepartmentModel>>
  typeLookup(
    type: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<AdvertTypeModel>>
  categoryLookup(
    categoryId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<AdvertCategoryModel>>
  categoriesLookup(
    categoryIds: string[],
    transaction?: Transaction,
  ): Promise<ResultWrapper<AdvertCategoryModel[]>>
  caseLookup(
    caseId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CaseModel>>
  generateInternalCaseNumber(
    transaction?: Transaction,
  ): Promise<ResultWrapper<{ internalCaseNumber: string }>>
  caseStatusLookup(
    status: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CaseStatusModel>>
  caseTagLookup(
    tag: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CaseTagModel>>
  caseCommunicationStatusLookup(
    status: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CaseCommunicationStatusModel>>
  caseCommunicationStatusLookupById(
    id: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CaseCommunicationStatusModel>>
  caseLookupByApplicationId(
    advertId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CaseModel>>

  userLookup(userId: string): Promise<ResultWrapper<User>>

  getNextCaseNumber(
    departmentId: string,
    year: number,
    transaction?: Transaction,
  ): Promise<ResultWrapper<number>>

  getNextPublicationNumber(
    departmentId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<number>>

  institutionLookup(
    institutionId: string,
  ): Promise<ResultWrapper<AdvertInvolvedPartyModel>>
}

export const IUtilityService = Symbol('IUtilityService')

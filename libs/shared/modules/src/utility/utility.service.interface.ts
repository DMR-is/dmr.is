import { Transaction } from 'sequelize'
import { GetApplicationResponse, User } from '@dmr.is/shared/dto'
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
  approveApplication(applicationId: string): Promise<ResultWrapper>

  rejectApplication(applicationId: string): Promise<ResultWrapper>
  applicationLookup(
    applicationId: string,
  ): Promise<ResultWrapper<GetApplicationResponse>>
  advertStatusLookup(status: string): Promise<ResultWrapper<AdvertStatusDTO>>
  departmentLookup(
    departmentId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<AdvertDepartmentDTO>>
  typeLookup(
    type: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<AdvertTypeDTO>>
  categoryLookup(
    categoryId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<AdvertCategoryDTO>>
  caseLookup(
    caseId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CaseDto>>
  generateInternalCaseNumber(
    transaction?: Transaction,
  ): Promise<ResultWrapper<string>>
  caseStatusLookup(
    status: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CaseStatusDto>>
  caseTagLookup(
    tag: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CaseStatusDto>>
  caseCommunicationStatusLookup(
    status: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CaseCommunicationStatusDto>>
  caseCommunicationStatusLookupById(
    id: string,
  ): Promise<ResultWrapper<CaseCommunicationStatusDto>>
  caseLookupByApplicationId(
    advertId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CaseDto>>

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
}

export const IUtilityService = Symbol('IUtilityService')

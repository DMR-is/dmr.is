import { Transaction } from 'sequelize'
import {
  AdvertCategoryModel,
  AdvertDepartmentModel,
  AdvertStatusModel,
  AdvertTypeModel,
  CaseCommunicationStatusModel,
  CaseStatusModel,
  CaseTagModel,
} from '@dmr.is/official-journal/models'
import { ResultWrapper } from '@dmr.is/types'

export interface IUtilityService {
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

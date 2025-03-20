import { Transaction } from 'sequelize'
import {
  AdminUser,
  CaseCommunicationStatus,
  UpdateAdvertHtmlBody,
  UpdateCaseBody,
  UpdateCaseDepartmentBody,
  UpdateCasePriceBody,
  UpdateCaseStatusBody,
  UpdateCaseTypeBody,
  UpdateCategoriesBody,
  UpdateCommunicationStatusBody,
  UpdateFasttrackBody,
  UpdateNextStatusBody,
  UpdatePublishDateBody,
  UpdateTagBody,
  UpdateTitleBody,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

export interface ICaseUpdateService {
  updateCase(
    body: UpdateCaseBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper>

  updateFasttrack(
    caseId: string,
    body: UpdateFasttrackBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper>
  updateEmployee(
    caseId: string,
    userId: string,
    currentUser: AdminUser,
    transaction?: Transaction,
  ): Promise<ResultWrapper>
  updateCaseStatus(
    caseUd: string,
    body: UpdateCaseStatusBody,
    currentUser: AdminUser,
    transaction?: Transaction,
  ): Promise<ResultWrapper>
  updateCaseNextStatus(
    caseId: string,
    currentUser: AdminUser,
    transaction?: Transaction,
  ): Promise<ResultWrapper>

  updateCasePreviousStatus(
    caseId: string,
    currentUser: AdminUser,
    transaction?: Transaction,
  ): Promise<ResultWrapper>

  updateCasePrice(
    caseId: string,
    body: UpdateCasePriceBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper>
  updateCaseDepartment(
    caseId: string,
    body: UpdateCaseDepartmentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper>
  updateCaseType(
    caseId: string,
    body: UpdateCaseTypeBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper>

  updateCaseCategories(
    caseId: string,
    body: UpdateCategoriesBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper>

  updateCaseRequestedPublishDate(
    caseId: string,
    body: UpdatePublishDateBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper>

  updateCaseTitle(
    caseId: string,
    body: UpdateTitleBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper>

  updateCaseTag(
    caseId: string,
    body: UpdateTagBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper>

  updateCaseCommunicationStatus(
    caseId: string,
    body: UpdateCommunicationStatusBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper>

  updateCaseCommunicationStatusByStatus(
    caseId: string,
    body: CaseCommunicationStatus,
    transaction?: Transaction,
  ): Promise<ResultWrapper>

  updateAdvert(
    caseId: string,
    body: UpdateAdvertHtmlBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper>
}

export const ICaseUpdateService = Symbol('ICaseUpdateService')

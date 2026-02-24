import { Transaction } from 'sequelize'

import {
  CaseCommunicationStatus,
  UpdateAdvertHtmlBody,
  UpdateCaseBody,
  UpdateCaseDepartmentBody,
  UpdateCaseInvolvedPartyBody,
  UpdateCasePriceBody,
  UpdateCaseStatusBody,
  UpdateCaseTypeBody,
  UpdateCategoriesBody,
  UpdateCommunicationStatusBody,
  UpdateFasttrackBody,
  UpdatePublishDateBody,
  UpdateTagBody,
  UpdateTitleBody,
  UserDto,
} from '@dmr.is/shared-dto'
import { ResultWrapper } from '@dmr.is/types'

export interface ICaseUpdateService {
  updateCase(
    caseId: string,
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
    currentUser: UserDto,
    transaction?: Transaction,
  ): Promise<ResultWrapper>
  updateCaseStatus(
    caseId: string,
    body: UpdateCaseStatusBody,
    currentUser: UserDto,
    transaction?: Transaction,
  ): Promise<ResultWrapper>
  updateCaseNextStatus(
    caseId: string,
    currentUser: UserDto,
    transaction?: Transaction,
  ): Promise<ResultWrapper>

  updateCasePreviousStatus(
    caseId: string,
    currentUser: UserDto,
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

  updateCaseAddition(
    additionId: string,
    caseId: string,
    title?: string,
    content?: string,
    newOrder?: number,
    transaction?: Transaction,
  ): Promise<ResultWrapper>

  deleteCaseAddition(
    additionId: string,
    caseId: string,
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

  updateCaseInvolvedParty(
    caseId: string,
    body: UpdateCaseInvolvedPartyBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<{ advertId?: string; caseId?: string }>>
}

export const ICaseUpdateService = Symbol('ICaseUpdateService')

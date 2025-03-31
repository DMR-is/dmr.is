import { Transaction } from 'sequelize'
import { CaseCommunicationStatusEnum } from '@dmr.is/official-journal/models'
import { UserDto } from '@dmr.is/official-journal/modules/user'
import { ResultWrapper } from '@dmr.is/types'

import { UpdateAdvertHtmlBody } from '../../dto/update-advert-html-body.dto'
import { UpdateCaseBody } from '../../dto/update-case-body.dto'
import { UpdateCaseStatusBody } from '../../dto/update-case-status-body.dto'
import { UpdateCategoriesBody } from '../../dto/update-category-body.dto'
import { UpdateCommunicationStatusBody } from '../../dto/update-communication-status.dto'
import { UpdateCaseDepartmentBody } from '../../dto/update-department-body.dto'
import { UpdateFasttrackBody } from '../../dto/update-fasttrack-body.dto'
import { UpdateCasePriceBody } from '../../dto/update-price-body.dto'
import { UpdatePublishDateBody } from '../../dto/update-publish-date-body.dto'
import { UpdateTagBody } from '../../dto/update-tag-body.dto'
import { UpdateTitleBody } from '../../dto/update-title-body.dto'
import { UpdateCaseTypeBody } from '../../dto/update-type-body.dto'

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
    currentUser: UserDto,
    transaction?: Transaction,
  ): Promise<ResultWrapper>
  updateCaseStatus(
    caseUd: string,
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

  updateCaseCommunicationStatus(
    caseId: string,
    body: UpdateCommunicationStatusBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper>

  updateCaseCommunicationStatusByStatus(
    caseId: string,
    body: CaseCommunicationStatusEnum,
    transaction?: Transaction,
  ): Promise<ResultWrapper>

  updateAdvert(
    caseId: string,
    body: UpdateAdvertHtmlBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper>
}

export const ICaseUpdateService = Symbol('ICaseUpdateService')

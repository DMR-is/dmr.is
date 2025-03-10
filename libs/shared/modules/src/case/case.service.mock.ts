/* eslint-disable @typescript-eslint/no-unused-vars */
import { Transaction } from 'sequelize'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { ALL_MOCK_USERS } from '@dmr.is/mocks'
import {
  AddCaseAdvertCorrection,
  Case,
  CaseComment,
  CaseCommunicationStatus,
  CaseDetailed,
  CaseStatusEnum,
  CreateCaseChannelBody,
  CreateCaseResponse,
  DeleteCaseAdvertCorrection,
  DepartmentEnum,
  DepartmentSlugEnum,
  GetCaseCommentsQuery,
  GetCaseResponse,
  GetCasesQuery,
  GetCasesReponse,
  GetCasesWithDepartmentCount,
  GetCasesWithDepartmentCountQuery,
  GetCasesWithPublicationNumber,
  GetCasesWithPublicationNumberQuery,
  GetCasesWithStatusCount,
  GetCommunicationSatusesResponse,
  GetNextPublicationNumberResponse,
  GetTagsResponse,
  GetUsersQuery,
  GetUsersResponse,
  PostApplicationAttachmentBody,
  PostApplicationBody,
  PostCaseCommentBody,
  PostCasePublishBody,
  PresignedUrlResponse,
  UpdateAdvertHtmlBody,
  UpdateAdvertHtmlCorrection,
  UpdateCaseBody,
  UpdateCaseDepartmentBody,
  UpdateCasePriceBody,
  UpdateCaseStatusBody,
  UpdateCaseTypeBody,
  UpdateCategoriesBody,
  UpdateCommunicationStatusBody,
  UpdateNextStatusBody,
  UpdatePaidBody,
  UpdatePublishDateBody,
  UpdateTagBody,
  UpdateTitleBody,
} from '@dmr.is/shared/dto'
import { GenericError, ResultWrapper } from '@dmr.is/types'

import {
  BadRequestException,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common'

import { ICaseService } from './case.service.interface'

// export class CaseServiceMock implements ICaseService {
export class CaseServiceMock {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {
    this.logger.info('Using CaseServiceMock')
  }
  getCasesWithPublicationNumber(
    department: DepartmentEnum,
    params: GetCasesWithPublicationNumberQuery,
  ): Promise<ResultWrapper<GetCasesWithPublicationNumber>> {
    throw new Error('Method not implemented.')
  }

  getCasesWithStatusCount(
    status: string,
    params?: GetCasesQuery,
  ): Promise<ResultWrapper<GetCasesWithStatusCount>> {
    throw new Error('Method not implemented.')
  }

  unpublishCase(id: string): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  rejectCase(id: string): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  updateCasePreviousStatus(
    id: string,
    body: UpdateNextStatusBody,
  ): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  updateAdvertByHtml(
    caseId: string,
    body: UpdateAdvertHtmlBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  updateAdvert(
    caseId: string,
    body: UpdateAdvertHtmlCorrection,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  getCasesWithDepartmentCount(
    department: string,
    query?: GetCasesWithDepartmentCountQuery,
  ): Promise<ResultWrapper<GetCasesWithDepartmentCount>> {
    throw new Error('Method not implemented.')
  }
  updateEmployee(id: string, userId: string): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  updateCaseTag(caseId: string, body: UpdateTagBody): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  overwriteCaseAttachment(
    caseId: string,
    attachmentId: string,
    newAttachment: PostApplicationAttachmentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<PresignedUrlResponse>> {
    throw new Error('Method not implemented.')
  }
  getCaseAttachment(
    caseId: string,
    attachmentId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<PresignedUrlResponse>> {
    throw new Error('Method not implemented.')
  }
  getCaseAttachments(caseId: string): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  getCasesOverview(
    status?: string,
    params?: GetCasesQuery,
  ): Promise<ResultWrapper<GetCasesWithStatusCount>> {
    throw new Error('Method not implemented.')
  }
  createCaseChannel(
    caseId: string,
    body: CreateCaseChannelBody,
  ): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  updateCasePrice(
    caseId: string,
    body: UpdateCasePriceBody,
  ): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  updateCaseCommunicationStatus(
    caseId: string,
    body: UpdateCommunicationStatusBody,
  ): Promise<ResultWrapper<undefined>> {
    throw new Error('Method not implemented.')
  }
  updateCaseCommunicationStatusByStatus(
    caseId: string,
    body: CaseCommunicationStatus,
  ): Promise<ResultWrapper<undefined>> {
    throw new Error('Method not implemented.')
  }
  getCommunicationStatuses(): Promise<
    ResultWrapper<GetCommunicationSatusesResponse, GenericError>
  > {
    throw new Error('Method not implemented.')
  }
  getNextCasePublicationNumber(
    departmentId: string,
  ): Promise<ResultWrapper<GetNextPublicationNumberResponse, GenericError>> {
    throw new Error('Method not implemented.')
  }
  getCaseTags(): Promise<ResultWrapper<GetTagsResponse>> {
    throw new Error('Method not implemented.')
  }
  updateCase(body: UpdateCaseBody): Promise<ResultWrapper<undefined>> {
    throw new Error('Method not implemented.')
  }
  udpateCaseTag(
    caseId: string,
    body: UpdateTagBody,
  ): Promise<ResultWrapper<undefined>> {
    throw new Error('Method not implemented.')
  }
  updateCasePaid(
    caseId: string,
    body: UpdatePaidBody,
  ): Promise<ResultWrapper<undefined>> {
    throw new Error('Method not implemented.')
  }
  updateCaseType(
    caseId: string,
    body: UpdateCaseTypeBody,
  ): Promise<ResultWrapper<undefined>> {
    throw new Error('Method not implemented.')
  }
  updateCaseCategories(
    caseId: string,
    body: UpdateCategoriesBody,
  ): Promise<ResultWrapper<undefined>> {
    throw new Error('Method not implemented.')
  }
  updateCaseRequestedPublishDate(
    caseId: string,
    body: UpdatePublishDateBody,
  ): Promise<ResultWrapper<undefined>> {
    throw new Error('Method not implemented.')
  }
  updateCaseTitle(
    caseId: string,
    body: UpdateTitleBody,
  ): Promise<ResultWrapper<undefined>> {
    throw new Error('Method not implemented.')
  }
  updateCaseDepartment(
    caseId: string,
    body: UpdateCaseDepartmentBody,
  ): Promise<ResultWrapper<undefined>> {
    throw new Error('Method not implemented.')
  }
  updateCaseNextStatus(id: string): Promise<ResultWrapper<undefined>> {
    throw new Error('Method not implemented.')
  }
  updateCaseStatus(
    id: string,
    body: UpdateCaseStatusBody,
  ): Promise<ResultWrapper<undefined>> {
    throw new Error('Method not implemented.')
  }
  assignUserToCase(
    id: string,
    userId: string,
  ): Promise<ResultWrapper<undefined>> {
    throw new Error('Method not implemented.')
  }
  publishCases(body: PostCasePublishBody): Promise<ResultWrapper<undefined>> {
    throw new Error('Method not implemented.')
  }

  createCase(
    body: PostApplicationBody,
  ): Promise<ResultWrapper<CreateCaseResponse>> {
    this.logger.info('createCase', body)
    throw new Error('Method not implemented.')
  }

  getCaseByApplicationId(applicationId: string): Promise<CaseDetailed | null> {
    this.logger.info('getCaseByApplicationId', applicationId)
    throw new Error('Method not implemented.')
  }

  getComments(
    caseId: string,
    params?: GetCaseCommentsQuery | undefined,
  ): Promise<CaseComment[]> {
    this.logger.info('getComments', caseId, params)
    throw new Error('Method not implemented.')
  }
  postComment(
    caseId: string,
    body: PostCaseCommentBody,
  ): Promise<CaseComment[]> {
    this.logger.info('postComment', caseId, body)
    throw new Error('Method not implemented.')
  }
  deleteComment(caseId: string, commentId: string): Promise<CaseComment[]> {
    this.logger.info('deleteComment', caseId, commentId)
    throw new Error('Method not implemented.')
  }
  getCase(id: string): Promise<ResultWrapper<GetCaseResponse>> {
    this.logger.info('getCase', id)
    throw new Error('Method not implemented.')
  }

  getCases(params?: GetCasesQuery): Promise<ResultWrapper<GetCasesReponse>> {
    throw new Error('Method not implemented.')
  }

  postCaseCorrection(
    caseId: string,
    body: AddCaseAdvertCorrection,
  ): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }

  deleteCorrection(
    caseId: string,
    body: DeleteCaseAdvertCorrection,
  ): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
}

import { Transaction } from 'sequelize'
import {
  AddCaseAdvertCorrection,
  CaseCommunicationStatus,
  CaseStatusEnum,
  CreateCaseChannelBody,
  DeleteCaseAdvertCorrection,
  DepartmentEnum,
  GetCaseResponse,
  GetCasesQuery,
  GetCasesReponse,
  GetCasesWithDepartmentCount,
  GetCasesWithDepartmentCountQuery,
  GetCasesWithPublicationNumber,
  GetCasesWithPublicationNumberQuery,
  GetCasesWithStatusCount,
  GetCasesWithStatusCountQuery,
  GetCommunicationSatusesResponse,
  GetNextPublicationNumberResponse,
  GetTagsResponse,
  PostApplicationAttachmentBody,
  PostApplicationBody,
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
  UpdateFasttrackBody,
  UpdatePaidBody,
  UpdatePublishDateBody,
  UpdateTagBody,
  UpdateTitleBody,
  UserDto,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

export interface ICaseService {
  getCase(id: string): Promise<ResultWrapper<GetCaseResponse>>
  getCases(params?: GetCasesQuery): Promise<ResultWrapper<GetCasesReponse>>

  getCasesWithPublicationNumber(
    department: DepartmentEnum,
    params: GetCasesWithPublicationNumberQuery,
  ): Promise<ResultWrapper<GetCasesWithPublicationNumber>>

  getCasesWithDepartmentCount(
    department: DepartmentEnum,
    query?: GetCasesWithDepartmentCountQuery,
  ): Promise<ResultWrapper<GetCasesWithDepartmentCount>>
  createCase(
    body: PostApplicationBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper>

  publishCases(body: PostCasePublishBody): Promise<ResultWrapper>
  getCasesWithStatusCount(
    status: CaseStatusEnum,
    params?: GetCasesWithStatusCountQuery,
  ): Promise<ResultWrapper<GetCasesWithStatusCount>>
  getCaseTags(): Promise<ResultWrapper<GetTagsResponse>>

  createCaseChannel(
    caseId: string,
    body: CreateCaseChannelBody,
  ): Promise<ResultWrapper>

  updateCase(
    body: UpdateCaseBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper>
  updateEmployee(
    id: string,
    userId: string,
    currentUser: UserDto,
  ): Promise<ResultWrapper>
  updateCaseStatus(
    id: string,
    body: UpdateCaseStatusBody,
    currentUser: UserDto,
  ): Promise<ResultWrapper>
  updateCaseNextStatus(id: string, currentUser: UserDto): Promise<ResultWrapper>

  updateCasePreviousStatus(
    id: string,
    currentUser: UserDto,
  ): Promise<ResultWrapper>

  rejectCase(id: string): Promise<ResultWrapper>

  unpublishCase(id: string): Promise<ResultWrapper>
  updateCasePrice(
    caseId: string,
    body: UpdateCasePriceBody,
  ): Promise<ResultWrapper>
  updateCaseDepartment(
    caseId: string,
    body: UpdateCaseDepartmentBody,
  ): Promise<ResultWrapper>
  updateCaseType(
    caseId: string,
    body: UpdateCaseTypeBody,
  ): Promise<ResultWrapper>

  updateCaseCategories(
    caseId: string,
    body: UpdateCategoriesBody,
  ): Promise<ResultWrapper>

  updateCaseRequestedPublishDate(
    caseId: string,
    body: UpdatePublishDateBody,
  ): Promise<ResultWrapper>

  updateCaseTitle(caseId: string, body: UpdateTitleBody): Promise<ResultWrapper>
  updateCasePaid(caseId: string, body: UpdatePaidBody): Promise<ResultWrapper>

  updateCaseFasttrack(
    caseId: string,
    body: UpdateFasttrackBody,
  ): Promise<ResultWrapper>

  updateCaseTag(caseId: string, body: UpdateTagBody): Promise<ResultWrapper>

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

  getNextCasePublicationNumber(
    departmentId: string,
  ): Promise<ResultWrapper<GetNextPublicationNumberResponse>>

  postCaseCorrection(
    caseId: string,
    body: AddCaseAdvertCorrection,
    transaction?: Transaction,
  ): Promise<ResultWrapper>

  deleteCorrection(
    caseId: string,
    body: DeleteCaseAdvertCorrection,
    transaction?: Transaction,
  ): Promise<ResultWrapper>

  getCommunicationStatuses(): Promise<
    ResultWrapper<GetCommunicationSatusesResponse>
  >

  getCaseAttachment(
    caseId: string,
    attachmentId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<PresignedUrlResponse>>

  overwriteCaseAttachment(
    caseId: string,
    attachmentId: string,
    newAttachment: PostApplicationAttachmentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<PresignedUrlResponse>>

  updateAdvertByHtml(
    caseId: string,
    body: UpdateAdvertHtmlBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper>

  updateAdvert(
    caseId: string,
    body: UpdateAdvertHtmlCorrection,
    transaction?: Transaction,
  ): Promise<ResultWrapper>

  createCaseHistory(
    caseId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper>

  uploadAttachments(key: string): Promise<ResultWrapper<PresignedUrlResponse>>
}

export const ICaseService = Symbol('ICaseService')

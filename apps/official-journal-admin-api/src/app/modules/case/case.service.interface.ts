import { Transaction } from 'sequelize'
import { UserDto } from '@dmr.is/official-journal/dto/user/user.dto'
import {
  CaseCommunicationStatusEnum,
  CaseStatusEnum,
  DepartmentEnum,
} from '@dmr.is/official-journal/models'
import { PostApplicationAttachmentBody } from '@dmr.is/official-journal/modules/attachment'
import {
  GetPaymentQuery,
  GetPaymentResponse,
} from '@dmr.is/official-journal/modules/price'
import { PostApplicationBody } from '@dmr.is/shared/dto'
import { PresignedUrlResponse } from '@dmr.is/shared/modules/aws'
import { ResultWrapper } from '@dmr.is/types'

import {
  AddCaseAdvertCorrection,
  DeleteCaseAdvertCorrection,
} from './dto/add-case-advert-correction.dto'
import {
  GetCasesWithDepartmentCount,
  GetCasesWithStatusCount,
} from './dto/case-with-counter.dto'
import { CreateCaseDto, CreateCaseResponseDto } from './dto/create-case.dto'
import { CreateCaseChannelBody } from './dto/create-case-channel-body.dto'
import { GetCaseResponse } from './dto/get-case-response.dto'
import { GetCasesQuery } from './dto/get-cases-query.dto'
import { GetCasesReponse } from './dto/get-cases-response.dto'
import {
  GetCasesWithDepartmentCountQuery,
  GetCasesWithStatusCountQuery,
} from './dto/get-cases-with-count-query.dto'
import {
  GetCasesWithPublicationNumber,
  GetCasesWithPublicationNumberQuery,
} from './dto/get-cases-with-publication-number.dto'
import { GetCommunicationSatusesResponse } from './dto/get-communication-satuses-response.dto'
import { GetNextPublicationNumberResponse } from './dto/get-next-publication-number-response.dto'
import { GetTagsResponse } from './dto/get-tags-response.dto'
import { PostCasePublishBody } from './dto/post-publish-body.dto'
import {
  UpdateAdvertHtmlBody,
  UpdateAdvertHtmlCorrection,
} from './dto/update-advert-html-body.dto'
import { UpdateCaseBody } from './dto/update-case-body.dto'
import { UpdateCaseStatusBody } from './dto/update-case-status-body.dto'
import { UpdateCategoriesBody } from './dto/update-category-body.dto'
import { UpdateCommunicationStatusBody } from './dto/update-communication-status.dto'
import { UpdateCaseDepartmentBody } from './dto/update-department-body.dto'
import { UpdateFasttrackBody } from './dto/update-fasttrack-body.dto'
import { UpdateCasePriceBody } from './dto/update-price-body.dto'
import { UpdatePublishDateBody } from './dto/update-publish-date-body.dto'
import { UpdateTagBody } from './dto/update-tag-body.dto'
import { UpdateTitleBody } from './dto/update-title-body.dto'
import { UpdateCaseTypeBody } from './dto/update-type-body.dto'

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
  createCaseByApplication(
    body: PostApplicationBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper>

  createCase(
    currentUser: UserDto,
    body: CreateCaseDto,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CreateCaseResponseDto>>

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

  deleteCaseChannel(caseId: string, channelId: string): Promise<ResultWrapper>

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
    body: CaseCommunicationStatusEnum,
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

  getCasePaymentStatus(
    params: GetPaymentQuery,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetPaymentResponse>>
}

export const ICaseService = Symbol('ICaseService')

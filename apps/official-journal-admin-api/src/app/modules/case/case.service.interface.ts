import { Transaction } from 'sequelize'
import { UserDto } from '@dmr.is/official-journal/dto/user/user.dto'
import { CaseStatusEnum, DepartmentEnum } from '@dmr.is/official-journal/models'
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

  updateCasePreviousStatus(
    id: string,
    currentUser: UserDto,
  ): Promise<ResultWrapper>
  updateCaseNextStatus(id: string, currentUser: UserDto): Promise<ResultWrapper>

  rejectCase(id: string): Promise<ResultWrapper>

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

  uploadAttachments(key: string): Promise<ResultWrapper<PresignedUrlResponse>>

  getCasePaymentStatus(
    params: GetPaymentQuery,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetPaymentResponse>>
}

export const ICaseService = Symbol('ICaseService')

import { Transaction } from 'sequelize'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
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
import { UserDto } from '@dmr.is/official-journal/modules/user'
import { PostApplicationBody } from '@dmr.is/shared/dto'
import { PresignedUrlResponse } from '@dmr.is/shared/modules/aws'
import { ResultWrapper } from '@dmr.is/types'

import { Inject } from '@nestjs/common'

import {
  AddCaseAdvertCorrection,
  DeleteCaseAdvertCorrection,
} from './dto/add-case-advert-correction.dto'
import {
  GetCasesWithDepartmentCount,
  GetCasesWithStatusCount,
} from './dto/case.dto'
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
import { ICaseService } from './case.service.interface'

// export class CaseServiceMock implements ICaseService {
export class CaseServiceMock implements ICaseService {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {
    this.logger.info('Using CaseServiceMock')
  }
  getCase(id: string): Promise<ResultWrapper<GetCaseResponse>> {
    throw new Error('Method not implemented.')
  }
  getCases(params?: GetCasesQuery): Promise<ResultWrapper<GetCasesReponse>> {
    throw new Error('Method not implemented.')
  }
  getCasesWithPublicationNumber(
    department: DepartmentEnum,
    params: GetCasesWithPublicationNumberQuery,
  ): Promise<ResultWrapper<GetCasesWithPublicationNumber>> {
    throw new Error('Method not implemented.')
  }
  getCasesWithDepartmentCount(
    department: DepartmentEnum,
    query?: GetCasesWithDepartmentCountQuery,
  ): Promise<ResultWrapper<GetCasesWithDepartmentCount>> {
    throw new Error('Method not implemented.')
  }
  createCaseByApplication(
    body: PostApplicationBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  createCase(
    currentUser: UserDto,
    body: CreateCaseDto,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CreateCaseResponseDto>> {
    throw new Error('Method not implemented.')
  }
  publishCases(body: PostCasePublishBody): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  getCasesWithStatusCount(
    status: CaseStatusEnum,
    params?: GetCasesWithStatusCountQuery,
  ): Promise<ResultWrapper<GetCasesWithStatusCount>> {
    throw new Error('Method not implemented.')
  }
  getCaseTags(): Promise<ResultWrapper<GetTagsResponse>> {
    throw new Error('Method not implemented.')
  }
  createCaseChannel(
    caseId: string,
    body: CreateCaseChannelBody,
  ): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  deleteCaseChannel(caseId: string, channelId: string): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  updateCase(
    body: UpdateCaseBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  updateEmployee(
    id: string,
    userId: string,
    currentUser: UserDto,
  ): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  updateCaseStatus(
    id: string,
    body: UpdateCaseStatusBody,
    currentUser: UserDto,
  ): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  updateCaseNextStatus(
    id: string,
    currentUser: UserDto,
  ): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  updateCasePreviousStatus(
    id: string,
    currentUser: UserDto,
  ): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  rejectCase(id: string): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  updateCasePrice(
    caseId: string,
    body: UpdateCasePriceBody,
  ): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  updateCaseDepartment(
    caseId: string,
    body: UpdateCaseDepartmentBody,
  ): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  updateCaseType(
    caseId: string,
    body: UpdateCaseTypeBody,
  ): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  updateCaseCategories(
    caseId: string,
    body: UpdateCategoriesBody,
  ): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  updateCaseRequestedPublishDate(
    caseId: string,
    body: UpdatePublishDateBody,
  ): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  updateCaseTitle(
    caseId: string,
    body: UpdateTitleBody,
  ): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  updateCaseFasttrack(
    caseId: string,
    body: UpdateFasttrackBody,
  ): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  updateCaseTag(caseId: string, body: UpdateTagBody): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  updateCaseCommunicationStatus(
    caseId: string,
    body: UpdateCommunicationStatusBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  updateCaseCommunicationStatusByStatus(
    caseId: string,
    body: CaseCommunicationStatusEnum,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  getNextCasePublicationNumber(
    departmentId: string,
  ): Promise<ResultWrapper<GetNextPublicationNumberResponse>> {
    throw new Error('Method not implemented.')
  }
  postCaseCorrection(
    caseId: string,
    body: AddCaseAdvertCorrection,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  deleteCorrection(
    caseId: string,
    body: DeleteCaseAdvertCorrection,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  getCommunicationStatuses(): Promise<
    ResultWrapper<GetCommunicationSatusesResponse>
  > {
    throw new Error('Method not implemented.')
  }
  getCaseAttachment(
    caseId: string,
    attachmentId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<PresignedUrlResponse>> {
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
  createCaseHistory(
    caseId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  uploadAttachments(key: string): Promise<ResultWrapper<PresignedUrlResponse>> {
    throw new Error('Method not implemented.')
  }
  getCasePaymentStatus(
    params: GetPaymentQuery,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetPaymentResponse>> {
    throw new Error('Method not implemented.')
  }
}

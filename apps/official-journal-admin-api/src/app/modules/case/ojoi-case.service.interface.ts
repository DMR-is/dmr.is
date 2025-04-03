import { Transaction } from 'sequelize'
import { UserDto } from '@dmr.is/official-journal/dto/user/user.dto'
import { CaseStatusEnum, DepartmentEnum } from '@dmr.is/official-journal/models'
import { PostApplicationAttachmentBody } from '@dmr.is/official-journal/modules/attachment'
import { PresignedUrlResponse } from '@dmr.is/shared/modules/aws'
import { ResultWrapper } from '@dmr.is/types'

import {
  GetCasesWithDepartmentCount,
  GetCasesWithStatusCount,
} from './dto/case-with-counter.dto'
import {
  GetCasesWithDepartmentCountQuery,
  GetCasesWithStatusCountQuery,
} from './dto/get-cases-with-count-query.dto'
import {
  GetCasesWithPublicationNumber,
  GetCasesWithPublicationNumberQuery,
} from './dto/get-cases-with-publication-number.dto'
import { PostCasePublishBody } from './dto/post-publish-body.dto'
import {
  UpdateAdvertHtmlBody,
  UpdateAdvertHtmlCorrection,
} from './dto/update-advert-html-body.dto'

export interface IOfficialJournalCaseService {
  getCasesWithPublicationNumber(
    department: DepartmentEnum,
    params: GetCasesWithPublicationNumberQuery,
  ): Promise<ResultWrapper<GetCasesWithPublicationNumber>>

  getCasesWithDepartmentCount(
    department: DepartmentEnum,
    query?: GetCasesWithDepartmentCountQuery,
  ): Promise<ResultWrapper<GetCasesWithDepartmentCount>>
  getCasesWithStatusCount(
    status: CaseStatusEnum,
    params?: GetCasesWithStatusCountQuery,
  ): Promise<ResultWrapper<GetCasesWithStatusCount>>

  publishCases(body: PostCasePublishBody): Promise<ResultWrapper>

  rejectCase(id: string): Promise<ResultWrapper>
  updateCasePreviousStatus(
    id: string,
    currentUser: UserDto,
  ): Promise<ResultWrapper>
  updateCaseNextStatus(id: string, currentUser: UserDto): Promise<ResultWrapper>

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
}

export const IOfficialJournalCaseService = Symbol('IOfficialJournalCaseService')

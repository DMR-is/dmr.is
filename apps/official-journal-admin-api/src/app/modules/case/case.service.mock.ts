import { Transaction } from 'sequelize'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { UserDto } from '@dmr.is/official-journal/dto/user/user.dto'
import { CaseStatusEnum, DepartmentEnum } from '@dmr.is/official-journal/models'
import { PostApplicationAttachmentBody } from '@dmr.is/official-journal/modules/attachment'
import { PresignedUrlResponse } from '@dmr.is/shared/modules/aws'
import { ResultWrapper } from '@dmr.is/types'

import { Inject } from '@nestjs/common'

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
import { IOfficialJournalCaseService } from './case.service.interface'

// export class CaseServiceMock implements ICaseService {
export class CaseServiceMock implements IOfficialJournalCaseService {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {
    this.logger.info('Using CaseServiceMock')
  }
  getCasesWithPublicationNumber(
    _department: DepartmentEnum,
    _params: GetCasesWithPublicationNumberQuery,
  ): Promise<ResultWrapper<GetCasesWithPublicationNumber>> {
    throw new Error('Method not implemented.')
  }
  getCasesWithDepartmentCount(
    _department: DepartmentEnum,
    _query?: GetCasesWithDepartmentCountQuery,
  ): Promise<ResultWrapper<GetCasesWithDepartmentCount>> {
    throw new Error('Method not implemented.')
  }
  getCasesWithStatusCount(
    _status: CaseStatusEnum,
    _params?: GetCasesWithStatusCountQuery,
  ): Promise<ResultWrapper<GetCasesWithStatusCount>> {
    throw new Error('Method not implemented.')
  }
  publishCases(_body: PostCasePublishBody): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  rejectCase(_id: string): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  updateCasePreviousStatus(
    _id: string,
    _currentUser: UserDto,
  ): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  updateCaseNextStatus(
    _id: string,
    _currentUser: UserDto,
  ): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  getCaseAttachment(
    _caseId: string,
    _attachmentId: string,
    _transaction?: Transaction,
  ): Promise<ResultWrapper<PresignedUrlResponse>> {
    throw new Error('Method not implemented.')
  }
  overwriteCaseAttachment(
    _caseId: string,
    _attachmentId: string,
    _newAttachment: PostApplicationAttachmentBody,
    _transaction?: Transaction,
  ): Promise<ResultWrapper<PresignedUrlResponse>> {
    throw new Error('Method not implemented.')
  }
  updateAdvertByHtml(
    _caseId: string,
    _body: UpdateAdvertHtmlBody,
    _transaction?: Transaction,
  ): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  updateAdvert(
    _caseId: string,
    _body: UpdateAdvertHtmlCorrection,
    _transaction?: Transaction,
  ): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  uploadAttachments(
    _key: string,
  ): Promise<ResultWrapper<PresignedUrlResponse>> {
    throw new Error('Method not implemented.')
  }
}

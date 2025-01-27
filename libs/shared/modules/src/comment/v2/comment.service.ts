import { Transaction } from 'sequelize'
import { Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { CaseActionEnum } from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import { Inject, NotImplementedException } from '@nestjs/common'

import {
  ApplicationCommentBody,
  AssignSelfCommentBody,
  AssignUserCommentBody,
  ExternalCommentBody,
  InternalCommentBody,
  SubmitCommentBody,
  UpdateStatusCommentBody,
} from './dto/comment.dto'
import { ICommentServiceV2 } from './comment.service.interface'

const LOGGING_CONTEXT = 'CommentServiceV2'
const LOGGING_CATEGORY = 'comment-service-v2'

export class CommentServiceV2 implements ICommentServiceV2 {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {}

  @Transactional()
  createSubmitComment(
    caseId: string,
    action: CaseActionEnum,
    body: SubmitCommentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    throw new NotImplementedException()
  }

  @Transactional()
  async createAssignUserComment(
    caseId: string,
    action: CaseActionEnum,
    body: AssignUserCommentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    throw new NotImplementedException()
  }

  @Transactional()
  async createAssignSelfComment(
    caseId: string,
    action: CaseActionEnum,
    body: AssignSelfCommentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    throw new NotImplementedException()
  }

  @Transactional()
  async createUpdateStatusComment(
    caseId: string,
    action: CaseActionEnum,
    body: UpdateStatusCommentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    throw new NotImplementedException()
  }

  @Transactional()
  async createInternalComment(
    caseId: string,
    action: CaseActionEnum,
    body: InternalCommentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    throw new NotImplementedException()
  }

  @Transactional()
  async createExternalComment(
    caseId: string,
    action: CaseActionEnum,
    body: ExternalCommentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    throw new NotImplementedException()
  }

  @Transactional()
  async createApplicationComment(
    caseId: string,
    action: CaseActionEnum,
    body: ApplicationCommentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    throw new NotImplementedException()
  }
}

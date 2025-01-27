import { Transaction } from 'sequelize'
import { CaseActionEnum } from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import {
  ApplicationCommentBody,
  AssignSelfCommentBody,
  AssignUserCommentBody,
  ExternalCommentBody,
  InternalCommentBody,
  SubmitCommentBody,
  UpdateStatusCommentBody,
} from './dto/comment.dto'

export interface ICommentServiceV2 {
  createSubmitComment(
    caseId: string,
    action: CaseActionEnum,
    body: SubmitCommentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper>

  createAssignUserComment(
    caseId: string,
    action: CaseActionEnum,
    body: AssignUserCommentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper>

  createAssignSelfComment(
    caseId: string,
    action: CaseActionEnum,
    body: AssignSelfCommentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper>

  createUpdateStatusComment(
    caseId: string,
    action: CaseActionEnum,
    body: UpdateStatusCommentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper>

  createInternalComment(
    caseId: string,
    action: CaseActionEnum,
    body: InternalCommentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper>

  createExternalComment(
    caseId: string,
    action: CaseActionEnum,
    body: ExternalCommentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper>

  createApplicationComment(
    caseId: string,
    action: CaseActionEnum,
    body: ApplicationCommentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper>
}

export const ICommentServiceV2 = Symbol('ICommentServiceV2')

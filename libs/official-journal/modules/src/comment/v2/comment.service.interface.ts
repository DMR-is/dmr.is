import { Transaction } from 'sequelize'

import {
  ApplicationCommentBody,
  AssignSelfCommentBody,
  AssignUserCommentBody,
  ExternalCommentBody,
  GetComment,
  GetComments,
  GetCommentsQuery,
  InternalCommentBody,
  SubmitCommentBody,
  UpdateStatusCommentBody,
} from '@dmr.is/shared-dto'
import { ResultWrapper } from '@dmr.is/types'

export interface ICommentServiceV2 {
  getCommentById(
    caseId: string,
    commentId: string,
  ): Promise<ResultWrapper<GetComment>>

  getComments(
    caseId: string,
    query?: GetCommentsQuery,
    involvedPartyId?: string,
  ): Promise<ResultWrapper<GetComments>>

  deleteComment(
    caseId: string,
    commentId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper>

  createSubmitComment(
    caseId: string,
    body: SubmitCommentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetComment>>

  createAssignUserComment(
    caseId: string,
    body: AssignUserCommentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetComment>>

  createAssignSelfComment(
    caseId: string,
    body: AssignSelfCommentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetComment>>

  createUpdateStatusComment(
    caseId: string,
    body: UpdateStatusCommentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetComment>>

  createInternalComment(
    caseId: string,
    body: InternalCommentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetComment>>

  createExternalComment(
    caseId: string,
    body: ExternalCommentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetComment>>

  createApplicationComment(
    caseId: string,
    body: ApplicationCommentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetComment>>
}

export const ICommentServiceV2 = Symbol('ICommentServiceV2')

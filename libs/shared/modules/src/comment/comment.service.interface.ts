import { Transaction } from 'sequelize'
import {
  GetCaseCommentResponse,
  GetCaseCommentsQuery,
  GetCaseCommentsResponse,
  PostCaseCommentBody,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

export interface ICommentService {
  getComment(
    caseId: string,
    commentId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetCaseCommentResponse>>
  getComments(
    caseId: string,
    params?: GetCaseCommentsQuery,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetCaseCommentsResponse>>

  createComment(
    caseId: string,
    body: PostCaseCommentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper>

  deleteComment(
    caseId: string,
    commentId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper>
}

export const ICommentService = Symbol('ICommentService')

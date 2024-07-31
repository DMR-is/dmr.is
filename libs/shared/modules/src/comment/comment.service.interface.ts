import { Transaction } from 'sequelize'
import {
  GetCaseCommentResponse,
  GetCaseCommentsQuery,
  GetCaseCommentsResponse,
  PostCaseComment,
  PostCaseCommentResponse,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

export interface ICommentService {
  getComment(
    caseId: string,
    commentId: string,
  ): Promise<ResultWrapper<GetCaseCommentResponse>>
  getComments(
    caseId: string,
    params?: GetCaseCommentsQuery,
  ): Promise<ResultWrapper<GetCaseCommentsResponse>>

  createComment(
    caseId: string,
    body: PostCaseComment,
    transaction?: Transaction,
  ): Promise<ResultWrapper<PostCaseCommentResponse>>

  deleteComment(caseId: string, commentId: string): Promise<ResultWrapper>
}

export const ICommentService = Symbol('ICommentService')

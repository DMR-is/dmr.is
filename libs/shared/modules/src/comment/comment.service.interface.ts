import { Transaction } from 'sequelize'
import {
  DeleteCaseCommentResponse,
  GetCaseCommentResponse,
  GetCaseCommentsQuery,
  GetCaseCommentsResponse,
  PostCaseComment,
  PostCaseCommentResponse,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

export interface ICommentService {
  comment(
    caseId: string,
    commentId: string,
  ): Promise<ResultWrapper<GetCaseCommentResponse>>
  comments(
    caseId: string,
    params?: GetCaseCommentsQuery,
  ): Promise<ResultWrapper<GetCaseCommentsResponse>>

  create(
    caseId: string,
    body: PostCaseComment,
    transaction?: Transaction,
  ): Promise<ResultWrapper<PostCaseCommentResponse>>

  delete(
    caseId: string,
    commentId: string,
  ): Promise<ResultWrapper<DeleteCaseCommentResponse>>
}

export const ICommentService = Symbol('ICommentService')

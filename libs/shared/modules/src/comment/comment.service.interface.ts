import { Transaction } from 'sequelize'
import {
  DeleteCaseCommentResponse,
  GetCaseCommentResponse,
  GetCaseCommentsQuery,
  GetCaseCommentsResponse,
  PostCaseComment,
  PostCaseCommentResponse,
} from '@dmr.is/shared/dto'
import { Result } from '@dmr.is/types'

export interface ICommentService {
  comment(
    caseId: string,
    commentId: string,
  ): Promise<Result<GetCaseCommentResponse>>
  comments(
    caseId: string,
    params?: GetCaseCommentsQuery,
  ): Promise<Result<GetCaseCommentsResponse>>

  create(
    caseId: string,
    body: PostCaseComment,
    transaction?: Transaction,
  ): Promise<Result<PostCaseCommentResponse>>

  delete(
    caseId: string,
    commentId: string,
  ): Promise<Result<DeleteCaseCommentResponse>>
}

export const ICommentService = Symbol('ICommentService')

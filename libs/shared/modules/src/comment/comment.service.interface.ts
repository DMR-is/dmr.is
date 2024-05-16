import { Transaction } from 'sequelize'
import {
  DeleteCaseCommentResponse,
  GetCaseCommentResponse,
  GetCaseCommentsQuery,
  GetCaseCommentsResponse,
  PostCaseComment,
  PostCaseCommentResponse,
} from '@dmr.is/shared/dto'

export interface ICommentService {
  getComment(caseId: string, commentId: string): Promise<GetCaseCommentResponse>
  getComments(
    caseId: string,
    params?: GetCaseCommentsQuery,
  ): Promise<GetCaseCommentsResponse>

  postComment(
    caseId: string,
    body: PostCaseComment,
    transaction?: Transaction,
  ): Promise<PostCaseCommentResponse>

  deleteComment(
    caseId: string,
    commentId: string,
  ): Promise<DeleteCaseCommentResponse>
}

export const ICommentService = Symbol('ICaseCommentService')

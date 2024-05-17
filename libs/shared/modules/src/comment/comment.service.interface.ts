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
  comment(caseId: string, commentId: string): Promise<GetCaseCommentResponse>
  comments(
    caseId: string,
    params?: GetCaseCommentsQuery,
  ): Promise<GetCaseCommentsResponse>

  create(
    caseId: string,
    body: PostCaseComment,
    transaction?: Transaction,
  ): Promise<PostCaseCommentResponse>

  delete(caseId: string, commentId: string): Promise<DeleteCaseCommentResponse>
}

export const ICommentService = Symbol('ICommentService')

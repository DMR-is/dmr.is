import {
  CaseComment,
  GetCaseCommentsQuery,
  PostCaseComment,
} from '@dmr.is/shared/dto'

export interface ICaseCommentService {
  getComments(
    caseId: string,
    params?: GetCaseCommentsQuery,
  ): Promise<CaseComment[]>

  postComment(caseId: string, body: PostCaseComment): Promise<CaseComment[]>

  deleteComment(caseId: string, commentId: string): Promise<CaseComment[]>
}

export const ICaseCommentService = Symbol('ICaseCommentService')

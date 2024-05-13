import {
  CaseComment,
  DeleteCaseCommentResponse,
  GetCaseCommentsQuery,
  GetCaseCommentsResponse,
  PostCaseComment,
  PostCaseCommentResponse,
} from '@dmr.is/shared/dto'

export interface ICaseCommentService {
  getComments(
    caseId: string,
    params?: GetCaseCommentsQuery,
  ): Promise<GetCaseCommentsResponse>

  postComment(
    caseId: string,
    body: PostCaseComment,
  ): Promise<PostCaseCommentResponse>

  deleteComment(
    caseId: string,
    commentId: string,
  ): Promise<DeleteCaseCommentResponse>
}

export const ICaseCommentService = Symbol('ICaseCommentService')

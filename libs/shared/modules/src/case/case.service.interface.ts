import {
  Case,
  CaseComment,
  CaseEditorialOverview,
  GetCaseCommentsQuery,
  GetCasesQuery,
  GetCasesReponse,
  GetUsersQueryParams,
  GetUsersResponse,
  PostCaseComment,
  PostCasePublishBody,
} from '@dmr.is/shared/dto'

export interface ICaseService {
  getCase(id: string): Promise<Case | null>

  getCases(params?: GetCasesQuery): Promise<GetCasesReponse>

  getUsers(params?: GetUsersQueryParams): Promise<GetUsersResponse>

  getEditorialOverview(params?: GetCasesQuery): Promise<CaseEditorialOverview>

  postCasesPublish(body: PostCasePublishBody): Promise<void>

  getComments(
    caseId: string,
    params?: GetCaseCommentsQuery,
  ): Promise<CaseComment[]>

  postComment(caseId: string, body: PostCaseComment): Promise<CaseComment[]>

  deleteComment(caseId: string, commentId: string): Promise<CaseComment[]>
}

export const ICaseService = Symbol('ICaseService')

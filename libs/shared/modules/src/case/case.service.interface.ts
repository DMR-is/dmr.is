import {
  Case,
  CaseComment,
  CaseEditorialOverview,
  CaseHistory,
  GetCaseCommentsQuery,
  GetCasesQuery,
  GetCasesReponse,
  GetUsersQueryParams,
  GetUsersResponse,
  PostApplicationBody,
  PostCaseComment,
  PostCasePublishBody,
} from '@dmr.is/shared/dto'

export interface ICaseService {
  getCase(id: string): Promise<Case | null>

  getCases(params?: GetCasesQuery): Promise<GetCasesReponse>

  getCaseByApplicationId(applicationId: string): Promise<Case | null>

  createCase(body: PostApplicationBody): Promise<Case>

  updateCaseHistory(caseId: string): Promise<Case>

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

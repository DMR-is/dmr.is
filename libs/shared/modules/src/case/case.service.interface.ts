import {
  Case,
  CaseEditorialOverview,
  CaseHistory,
  CaseWithApplication,
  GetCasesQuery,
  GetCasesReponse,
  GetCasesWithApplicationReponse,
  GetUsersQueryParams,
  GetUsersResponse,
  PostApplicationBody,
  PostCasePublishBody,
} from '@dmr.is/shared/dto'

export interface ICaseService {
  getCase(id: string): Promise<Case | null>

  getCases(params?: GetCasesQuery): Promise<GetCasesReponse>

  getCaseWithApplication(id: string): Promise<CaseWithApplication | null>

  getCasesWithApplication(
    params?: GetCasesQuery,
  ): Promise<GetCasesWithApplicationReponse>

  getCaseHistory(caseId: string): Promise<CaseHistory>

  getCaseByApplicationId(applicationId: string): Promise<Case | null>

  createCase(body: PostApplicationBody): Promise<Case>

  updateCaseHistory(caseId: string): Promise<Case>

  getUsers(params?: GetUsersQueryParams): Promise<GetUsersResponse>

  getEditorialOverview(params?: GetCasesQuery): Promise<CaseEditorialOverview>

  postCasesPublish(body: PostCasePublishBody): Promise<void>
}

export const ICaseService = Symbol('ICaseService')

import {
  Case,
  CaseEditorialOverview,
  GetCasesQuery,
  GetCasesReponse,
  GetUsersQueryParams,
  GetUsersResponse,
  PostCasePublishBody,
} from '@dmr.is/shared/dto'

export interface ICaseService {
  getCase(id: string): Promise<Case | null>

  getCases(params?: GetCasesQuery): Promise<GetCasesReponse>

  getUsers(params?: GetUsersQueryParams): Promise<GetUsersResponse>

  getEditorialOverview(params?: GetCasesQuery): Promise<CaseEditorialOverview>

  postCasesPublish(body: PostCasePublishBody): Promise<void>
}

export const ICaseService = Symbol('ICaseService')

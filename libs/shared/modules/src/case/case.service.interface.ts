import {
  CaseEditorialOverview,
  CreateCaseResponse,
  GetCaseResponse,
  GetCasesQuery,
  GetCasesReponse,
  GetUsersQueryParams,
  GetUsersResponse,
  PostApplicationBody,
  PostCasePublishBody,
} from '@dmr.is/shared/dto'

export interface ICaseService {
  getCase(id: string): Promise<GetCaseResponse>

  getCases(params?: GetCasesQuery): Promise<GetCasesReponse>

  createCase(body: PostApplicationBody): Promise<CreateCaseResponse>

  getUsers(params?: GetUsersQueryParams): Promise<GetUsersResponse>

  getEditorialOverview(params?: GetCasesQuery): Promise<CaseEditorialOverview>

  postCasesPublish(body: PostCasePublishBody): Promise<void>
}

export const ICaseService = Symbol('ICaseService')

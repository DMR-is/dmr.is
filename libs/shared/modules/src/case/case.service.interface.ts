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
  case(id: string): Promise<GetCaseResponse>

  cases(params?: GetCasesQuery): Promise<GetCasesReponse>

  create(body: PostApplicationBody): Promise<CreateCaseResponse>

  publish(body: PostCasePublishBody): Promise<void>
  overview(params?: GetCasesQuery): Promise<CaseEditorialOverview>
}

export const ICaseService = Symbol('ICaseService')

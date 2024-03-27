import {
  Case,
  CaseEditorialOverview,
  GetCasesQuery,
  GetCasesReponse,
  GetUsersQueryParams,
  GetUsersResponse,
} from '@dmr.is/shared/dto'

export interface ICaseService {
  getCase(id: string): Promise<Case | null>

  getCases(params?: GetCasesQuery): Promise<GetCasesReponse>

  getUsers(params?: GetUsersQueryParams): Promise<GetUsersResponse>

  getEditorialOverview(params?: GetCasesQuery): Promise<CaseEditorialOverview>
}

export const ICaseService = Symbol('ICaseService')

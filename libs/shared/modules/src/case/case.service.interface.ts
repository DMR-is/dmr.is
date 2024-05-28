import {
  CaseEditorialOverview,
  CreateCaseResponse,
  GetCaseResponse,
  GetCasesQuery,
  GetCasesReponse,
  PostApplicationBody,
  PostCasePublishBody,
} from '@dmr.is/shared/dto'

import { Result } from '../types/result'

export interface ICaseService {
  case(id: string): Promise<Result<GetCaseResponse>>

  cases(params?: GetCasesQuery): Promise<GetCasesReponse>

  create(body: PostApplicationBody): Promise<CreateCaseResponse>

  publish(body: PostCasePublishBody): Promise<void>
  overview(params?: GetCasesQuery): Promise<CaseEditorialOverview>
}

export const ICaseService = Symbol('ICaseService')

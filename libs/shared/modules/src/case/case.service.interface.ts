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

  cases(params?: GetCasesQuery): Promise<Result<GetCasesReponse>>

  create(body: PostApplicationBody): Promise<Result<CreateCaseResponse>>
  publish(body: PostCasePublishBody): Promise<Result<undefined>>
  overview(params?: GetCasesQuery): Promise<Result<CaseEditorialOverview>>
}

export const ICaseService = Symbol('ICaseService')

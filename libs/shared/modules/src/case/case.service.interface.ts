import {
  CreateCaseResponse,
  EditorialOverviewResponse,
  GetCaseResponse,
  GetCasesQuery,
  GetCasesReponse,
  PostApplicationBody,
  PostCasePublishBody,
  UpdateCaseStatusBody,
} from '@dmr.is/shared/dto'

import { Result } from '../types/result'

export interface ICaseService {
  case(id: string): Promise<Result<GetCaseResponse>>
  cases(params?: GetCasesQuery): Promise<Result<GetCasesReponse>>
  create(body: PostApplicationBody): Promise<Result<CreateCaseResponse>>
  assign(id: string, userId: string): Promise<Result<undefined>>
  updateStatus(
    id: string,
    body: UpdateCaseStatusBody,
  ): Promise<Result<undefined>>
  updateNextStatus(id: string): Promise<Result<undefined>>
  publish(body: PostCasePublishBody): Promise<Result<undefined>>
  overview(params?: GetCasesQuery): Promise<Result<EditorialOverviewResponse>>
}

export const ICaseService = Symbol('ICaseService')

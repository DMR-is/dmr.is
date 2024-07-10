import {
  CreateCaseResponse,
  EditorialOverviewResponse,
  GetCaseResponse,
  GetCasesQuery,
  GetCasesReponse,
  PostApplicationBody,
  PostCasePublishBody,
  UpdateCaseStatusBody,
  UpdateCategoriesBody,
  UpdatePublishDateBody,
  UpdateTitleBody,
} from '@dmr.is/shared/dto'
import { Result } from '@dmr.is/types'

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

  updatePrice(caseId: string, price: string): Promise<Result<undefined>>
  updateDepartment(
    caseId: string,
    departmentId: string,
  ): Promise<Result<undefined>>

  updateCategories(
    caseId: string,
    body: UpdateCategoriesBody,
  ): Promise<Result<undefined>>

  updatePublishDate(
    caseId: string,
    body: UpdatePublishDateBody,
  ): Promise<Result<undefined>>

  updateTitle(caseId: string, body: UpdateTitleBody): Promise<Result<undefined>>
}

export const ICaseService = Symbol('ICaseService')

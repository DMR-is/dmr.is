import {
  CreateCaseResponse,
  EditorialOverviewResponse,
  GetCaseResponse,
  GetCasesQuery,
  GetCasesReponse,
  GetTagsResponse,
  PostApplicationBody,
  PostCasePublishBody,
  UpdateCaseDepartmentBody,
  UpdateCaseStatusBody,
  UpdateCaseTypeBody,
  UpdateCategoriesBody,
  UpdatePaidBody,
  UpdatePublishDateBody,
  UpdateTagBody,
  UpdateTitleBody,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

export interface ICaseService {
  case(id: string): Promise<ResultWrapper<GetCaseResponse>>
  cases(params?: GetCasesQuery): Promise<ResultWrapper<GetCasesReponse>>
  create(body: PostApplicationBody): Promise<ResultWrapper<CreateCaseResponse>>
  assign(id: string, userId: string): Promise<ResultWrapper<undefined>>
  updateStatus(
    id: string,
    body: UpdateCaseStatusBody,
  ): Promise<ResultWrapper<undefined>>
  updateNextStatus(id: string): Promise<ResultWrapper<undefined>>
  publish(body: PostCasePublishBody): Promise<ResultWrapper<undefined>>
  overview(
    params?: GetCasesQuery,
  ): Promise<ResultWrapper<EditorialOverviewResponse>>
  tags(): Promise<ResultWrapper<GetTagsResponse>>

  updatePrice(caseId: string, price: string): Promise<ResultWrapper<undefined>>
  updateDepartment(
    caseId: string,
    body: UpdateCaseDepartmentBody,
  ): Promise<ResultWrapper<undefined>>
  updateType(
    caseId: string,
    body: UpdateCaseTypeBody,
  ): Promise<ResultWrapper<undefined>>

  updateCategories(
    caseId: string,
    body: UpdateCategoriesBody,
  ): Promise<ResultWrapper<undefined>>

  updatePublishDate(
    caseId: string,
    body: UpdatePublishDateBody,
  ): Promise<ResultWrapper<undefined>>

  updateTitle(
    caseId: string,
    body: UpdateTitleBody,
  ): Promise<ResultWrapper<undefined>>
  updatePaid(
    caseId: string,
    body: UpdatePaidBody,
  ): Promise<ResultWrapper<undefined>>

  updateTag(
    caseId: string,
    body: UpdateTagBody,
  ): Promise<ResultWrapper<undefined>>
}

export const ICaseService = Symbol('ICaseService')

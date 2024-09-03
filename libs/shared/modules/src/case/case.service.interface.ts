import { Transaction } from 'sequelize'
import {
  CaseCommunicationStatus,
  CreateCaseResponse,
  EditorialOverviewResponse,
  GetCaseResponse,
  GetCasesQuery,
  GetCasesReponse,
  GetCommunicationSatusesResponse,
  GetNextPublicationNumberResponse,
  GetTagsResponse,
  PostApplicationBody,
  PostCasePublishBody,
  UpdateCaseDepartmentBody,
  UpdateCaseStatusBody,
  UpdateCaseTypeBody,
  UpdateCategoriesBody,
  UpdateCommunicationStatusBody,
  UpdatePaidBody,
  UpdatePublishDateBody,
  UpdateTagBody,
  UpdateTitleBody,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

export interface ICaseService {
  getCase(id: string): Promise<ResultWrapper<GetCaseResponse>>
  getCases(params?: GetCasesQuery): Promise<ResultWrapper<GetCasesReponse>>
  createCase(
    body: PostApplicationBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CreateCaseResponse>>
  assignUserToCase(
    id: string,
    userId: string,
  ): Promise<ResultWrapper<undefined>>
  updateCaseStatus(
    id: string,
    body: UpdateCaseStatusBody,
  ): Promise<ResultWrapper<undefined>>
  updateCaseNextStatus(id: string): Promise<ResultWrapper<undefined>>
  publishCases(body: PostCasePublishBody): Promise<ResultWrapper<undefined>>
  getCasesOverview(
    params?: GetCasesQuery,
  ): Promise<ResultWrapper<EditorialOverviewResponse>>
  getCaseTags(): Promise<ResultWrapper<GetTagsResponse>>

  updateCasePrice(
    caseId: string,
    price: string,
  ): Promise<ResultWrapper<undefined>>
  updateCaseDepartment(
    caseId: string,
    body: UpdateCaseDepartmentBody,
  ): Promise<ResultWrapper<undefined>>
  updateCaseType(
    caseId: string,
    body: UpdateCaseTypeBody,
  ): Promise<ResultWrapper<undefined>>

  updateCaseCategories(
    caseId: string,
    body: UpdateCategoriesBody,
  ): Promise<ResultWrapper<undefined>>

  updateCaseRequestedPublishDate(
    caseId: string,
    body: UpdatePublishDateBody,
  ): Promise<ResultWrapper<undefined>>

  updateCaseTitle(
    caseId: string,
    body: UpdateTitleBody,
  ): Promise<ResultWrapper<undefined>>
  updateCasePaid(
    caseId: string,
    body: UpdatePaidBody,
  ): Promise<ResultWrapper<undefined>>

  udpateCaseTag(
    caseId: string,
    body: UpdateTagBody,
  ): Promise<ResultWrapper<undefined>>

  getNextCasePublicationNumber(
    departmentId: string,
  ): Promise<ResultWrapper<GetNextPublicationNumberResponse>>

  getCommunicationStatuses(): Promise<
    ResultWrapper<GetCommunicationSatusesResponse>
  >

  updateCaseCommunicationStatus(
    caseId: string,
    body: UpdateCommunicationStatusBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<undefined>>

  updateCaseCommunicationStatusByStatus(
    caseId: string,
    body: CaseCommunicationStatus,
    transaction?: Transaction,
  ): Promise<ResultWrapper<undefined>>
}

export const ICaseService = Symbol('ICaseService')

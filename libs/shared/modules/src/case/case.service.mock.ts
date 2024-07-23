import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { ALL_MOCK_CASES, ALL_MOCK_USERS } from '@dmr.is/mocks'
import {
  Case,
  CaseComment,
  CaseStatus,
  CreateCaseResponse,
  EditorialOverviewResponse,
  GetCaseCommentsQuery,
  GetCaseResponse,
  GetCasesQuery,
  GetCasesReponse,
  GetTagsResponse,
  GetUsersQueryParams,
  GetUsersResponse,
  PostApplicationBody,
  PostCaseComment,
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

import {
  BadRequestException,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common'

import { ICaseService } from './case.service.interface'

export class CaseServiceMock implements ICaseService {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {
    this.logger.info('Using CaseServiceMock')
  }
  tags(): Promise<ResultWrapper<GetTagsResponse>> {
    throw new Error('Method not implemented.')
  }
  updateTag(
    caseId: string,
    body: UpdateTagBody,
  ): Promise<ResultWrapper<undefined>> {
    throw new Error('Method not implemented.')
  }
  updatePaid(
    caseId: string,
    body: UpdatePaidBody,
  ): Promise<ResultWrapper<undefined>> {
    throw new Error('Method not implemented.')
  }
  updateType(
    caseId: string,
    body: UpdateCaseTypeBody,
  ): Promise<ResultWrapper<undefined>> {
    throw new Error('Method not implemented.')
  }
  updateCategories(
    caseId: string,
    body: UpdateCategoriesBody,
  ): Promise<ResultWrapper<undefined>> {
    throw new Error('Method not implemented.')
  }
  updatePublishDate(
    caseId: string,
    body: UpdatePublishDateBody,
  ): Promise<ResultWrapper<undefined>> {
    throw new Error('Method not implemented.')
  }
  updateTitle(
    caseId: string,
    body: UpdateTitleBody,
  ): Promise<ResultWrapper<undefined>> {
    throw new Error('Method not implemented.')
  }
  updateDepartment(
    caseId: string,
    body: UpdateCaseDepartmentBody,
  ): Promise<ResultWrapper<undefined>> {
    throw new Error('Method not implemented.')
  }
  updatePrice(
    caseId: string,
    price: string,
  ): Promise<ResultWrapper<undefined>> {
    throw new Error('Method not implemented.')
  }
  updateNextStatus(id: string): Promise<ResultWrapper<undefined>> {
    throw new Error('Method not implemented.')
  }
  updateStatus(
    id: string,
    body: UpdateCaseStatusBody,
  ): Promise<ResultWrapper<undefined>> {
    throw new Error('Method not implemented.')
  }
  assign(id: string, userId: string): Promise<ResultWrapper<undefined>> {
    throw new Error('Method not implemented.')
  }
  publish(body: PostCasePublishBody): Promise<ResultWrapper<undefined>> {
    throw new Error('Method not implemented.')
  }

  create(
    body: PostApplicationBody,
  ): Promise<ResultWrapper<CreateCaseResponse>> {
    this.logger.info('createCase', body)
    throw new Error('Method not implemented.')
  }

  getCaseByApplicationId(applicationId: string): Promise<Case | null> {
    this.logger.info('getCaseByApplicationId', applicationId)
    throw new Error('Method not implemented.')
  }

  getComments(
    caseId: string,
    params?: GetCaseCommentsQuery | undefined,
  ): Promise<CaseComment[]> {
    this.logger.info('getComments', caseId, params)
    throw new Error('Method not implemented.')
  }
  postComment(caseId: string, body: PostCaseComment): Promise<CaseComment[]> {
    this.logger.info('postComment', caseId, body)
    throw new Error('Method not implemented.')
  }
  deleteComment(caseId: string, commentId: string): Promise<CaseComment[]> {
    this.logger.info('deleteComment', caseId, commentId)
    throw new Error('Method not implemented.')
  }
  case(id: string): Promise<ResultWrapper<GetCaseResponse>> {
    this.logger.info('getCase', id)
    throw new Error('Method not implemented.')
  }

  cases(params?: GetCasesQuery): Promise<ResultWrapper<GetCasesReponse>> {
    throw new Error('Method not implemented.')
  }

  getUsers(params?: GetUsersQueryParams): Promise<GetUsersResponse> {
    const filtered = ALL_MOCK_USERS.filter((user) => {
      if (params?.search && user.id !== params.search) {
        return false
      }

      if (!user.active) {
        return false
      }

      return true
    })

    return Promise.resolve({
      users: filtered,
    })
  }

  async overview(
    params?: GetCasesQuery,
  ): Promise<ResultWrapper<EditorialOverviewResponse>> {
    const submitted: Case[] = []
    const inProgress: Case[] = []
    const inReview: Case[] = []
    const ready: Case[] = []

    if (!params?.status) {
      throw new BadRequestException('Missing status')
    }

    ALL_MOCK_CASES.forEach((c) => {
      if (c.status === CaseStatus.Submitted) {
        submitted.push(c)
      } else if (c.status === CaseStatus.InProgress) {
        inProgress.push(c)
      } else if (c.status === CaseStatus.InReview) {
        inReview.push(c)
      } else if (c.status === CaseStatus.ReadyForPublishing) {
        ready.push(c)
      }
    })

    const response = (await this.cases(params)).unwrap()

    const { cases, paging } = response

    return Promise.resolve(
      ResultWrapper.ok({
        cases,
        totalItems: {
          submitted: submitted.length,
          inProgress: inProgress.length,
          inReview: inReview.length,
          ready: ready.length,
        },
        paging,
      }),
    )
  }
}

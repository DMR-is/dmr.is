/* eslint-disable @typescript-eslint/no-unused-vars */
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
  GetNextPublicationNumberResponse,
  GetTagsResponse,
  GetUsersQueryParams,
  GetUsersResponse,
  PostApplicationBody,
  PostCaseCommentBody,
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
import { GenericError, ResultWrapper } from '@dmr.is/types'

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
  getNextCasePublicationNumber(
    departmentId: string,
  ): Promise<ResultWrapper<GetNextPublicationNumberResponse, GenericError>> {
    throw new Error('Method not implemented.')
  }
  getCaseTags(): Promise<ResultWrapper<GetTagsResponse>> {
    throw new Error('Method not implemented.')
  }
  udpateCaseTag(
    caseId: string,
    body: UpdateTagBody,
  ): Promise<ResultWrapper<undefined>> {
    throw new Error('Method not implemented.')
  }
  updateCasePaid(
    caseId: string,
    body: UpdatePaidBody,
  ): Promise<ResultWrapper<undefined>> {
    throw new Error('Method not implemented.')
  }
  updateCaseType(
    caseId: string,
    body: UpdateCaseTypeBody,
  ): Promise<ResultWrapper<undefined>> {
    throw new Error('Method not implemented.')
  }
  updateCaseCategories(
    caseId: string,
    body: UpdateCategoriesBody,
  ): Promise<ResultWrapper<undefined>> {
    throw new Error('Method not implemented.')
  }
  updateCaseRequestedPublishDate(
    caseId: string,
    body: UpdatePublishDateBody,
  ): Promise<ResultWrapper<undefined>> {
    throw new Error('Method not implemented.')
  }
  updateCaseTitle(
    caseId: string,
    body: UpdateTitleBody,
  ): Promise<ResultWrapper<undefined>> {
    throw new Error('Method not implemented.')
  }
  updateCaseDepartment(
    caseId: string,
    body: UpdateCaseDepartmentBody,
  ): Promise<ResultWrapper<undefined>> {
    throw new Error('Method not implemented.')
  }
  updateCasePrice(
    caseId: string,
    price: string,
  ): Promise<ResultWrapper<undefined>> {
    throw new Error('Method not implemented.')
  }
  updateCaseNextStatus(id: string): Promise<ResultWrapper<undefined>> {
    throw new Error('Method not implemented.')
  }
  updateCaseStatus(
    id: string,
    body: UpdateCaseStatusBody,
  ): Promise<ResultWrapper<undefined>> {
    throw new Error('Method not implemented.')
  }
  assignUserToCase(
    id: string,
    userId: string,
  ): Promise<ResultWrapper<undefined>> {
    throw new Error('Method not implemented.')
  }
  publishCases(body: PostCasePublishBody): Promise<ResultWrapper<undefined>> {
    throw new Error('Method not implemented.')
  }

  createCase(
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
  postComment(
    caseId: string,
    body: PostCaseCommentBody,
  ): Promise<CaseComment[]> {
    this.logger.info('postComment', caseId, body)
    throw new Error('Method not implemented.')
  }
  deleteComment(caseId: string, commentId: string): Promise<CaseComment[]> {
    this.logger.info('deleteComment', caseId, commentId)
    throw new Error('Method not implemented.')
  }
  getCase(id: string): Promise<ResultWrapper<GetCaseResponse>> {
    this.logger.info('getCase', id)
    throw new Error('Method not implemented.')
  }

  getCases(params?: GetCasesQuery): Promise<ResultWrapper<GetCasesReponse>> {
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

  async getCasesOverview(
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

    const response = (await this.getCases(params)).unwrap()

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

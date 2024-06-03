import { isBooleanString } from 'class-validator'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { ALL_MOCK_CASES, ALL_MOCK_USERS } from '@dmr.is/mocks'
import {
  Case,
  CaseComment,
  CaseEditorialOverview,
  CaseHistory,
  CaseStatus,
  CaseWithAdvert,
  CreateCaseResponse,
  GetCaseCommentsQuery,
  GetCaseResponse,
  GetCasesQuery,
  GetCasesReponse,
  GetUsersQueryParams,
  GetUsersResponse,
  PostApplicationBody,
  PostCaseComment,
  PostCasePublishBody,
} from '@dmr.is/shared/dto'
import { generatePaging } from '@dmr.is/utils'

import {
  BadRequestException,
  Inject,
  InternalServerErrorException,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common'

import { Result } from '../types/result'
import { ICaseService } from './case.service.interface'

export class CaseServiceMock implements ICaseService {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {
    this.logger.info('Using CaseServiceMock')
  }
  assign(id: string, userId: string): Promise<Result<undefined>> {
    throw new Error('Method not implemented.')
  }
  publish(body: PostCasePublishBody): Promise<Result<undefined>> {
    throw new Error('Method not implemented.')
  }
  getCaseHistory(caseId: string): Promise<CaseHistory> {
    this.logger.info('getCaseHistory', caseId)
    throw new Error('Method not implemented.')
  }
  updateCaseHistory(caseId: string): Promise<Case> {
    this.logger.info('updateCaseHistory', caseId)
    throw new Error('Method not implemented.')
  }

  create(body: PostApplicationBody): Promise<Result<CreateCaseResponse>> {
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
  case(id: string): Promise<Result<GetCaseResponse>> {
    this.logger.info('getCase', id)
    throw new Error('Method not implemented.')
  }

  cases(params?: GetCasesQuery): Promise<Result<GetCasesReponse>> {
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
  ): Promise<Result<CaseEditorialOverview>> {
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

    const response = await this.cases(params)
    if (!response.ok) {
      throw new InternalServerErrorException('Internal server error.')
    }

    const { cases, paging } = response.value

    return Promise.resolve({
      ok: true,
      value: {
        data: cases as unknown as Case[],
        totalItems: {
          submitted: submitted.length,
          inProgress: inProgress.length,
          inReview: inReview.length,
          ready: ready.length,
        },
        paging,
      },
    })
  }

  pblish(body: PostCasePublishBody): Promise<Result<undefined>> {
    throw new NotImplementedException()
  }
}

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { ALL_MOCK_USERS } from '@dmr.is/mocks'
import {
  Case,
  CaseComment,
  CreateCaseResponse,
  EditorialOverviewResponse,
  GetCaseCommentsQuery,
  GetCaseResponse,
  GetCasesQuery,
  GetCasesReponse,
  GetUsersQueryParams,
  GetUsersResponse,
  PostApplicationBody,
  PostCaseComment,
  PostCasePublishBody,
  UpdateCaseStatusBody,
} from '@dmr.is/shared/dto'
import { GenericError, ResultWrapper } from '@dmr.is/types'

import { Inject } from '@nestjs/common'

import { ICaseService } from './case.service.interface'

export class CaseServiceMock implements ICaseService {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {
    this.logger.info('Using CaseServiceMock')
  }
  overview(
    params?: GetCasesQuery | undefined,
  ): Promise<ResultWrapper<EditorialOverviewResponse, GenericError>> {
    throw new Error('Method not implemented.')
  }
  updateDepartment(
    caseId: string,
    departmentId: string,
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
}

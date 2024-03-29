import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  ALL_MOCK_CASES,
  ALL_MOCK_JOURNAL_DEPARTMENTS,
  ALL_MOCK_USERS,
  MOCK_PAGING_SINGLE_PAGE,
} from '@dmr.is/mocks'
import {
  Case,
  CaseEditorialOverview,
  CaseStatus,
  GetCasesQuery,
  GetCasesReponse,
  GetDepartmentsQueryParams,
  GetDepartmentsResponse,
  GetUsersQueryParams,
  GetUsersResponse,
} from '@dmr.is/shared/dto'
import { generatePaging } from '@dmr.is/utils'

import {
  BadRequestException,
  Inject,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'

import { ICaseService } from './case.service.interface'

export class CaseServiceMock implements ICaseService {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {
    this.logger.info('Using CaseServiceMock')
  }
  getCase(id: string): Promise<Case | null> {
    const found = ALL_MOCK_CASES.find((c) => c.id === id)

    if (!found) {
      throw new NotFoundException('Case not found')
    }

    return Promise.resolve(found)
  }

  getCases(params?: GetCasesQuery): Promise<GetCasesReponse> {
    if (!params) {
      return Promise.resolve({
        cases: ALL_MOCK_CASES,
        paging: generatePaging(ALL_MOCK_CASES),
      })
    }

    try {
      const { page } = params

      const filteredCases = ALL_MOCK_CASES.filter((c) => {
        // todo: search, which fields to search on?

        if (params?.caseNumber && c.caseNumber !== params?.caseNumber) {
          return false
        }

        if (
          params?.dateFrom &&
          new Date(c.createdAt) < new Date(params?.dateFrom)
        ) {
          return false
        }

        if (
          params?.dateTo &&
          new Date(c.createdAt) > new Date(params?.dateTo)
        ) {
          return false
        }

        if (params?.status && c.status !== params?.status) {
          return false
        }

        if (params?.fastTrack && c.fastTrack !== params?.fastTrack) {
          return false
        }

        if (params?.employeeId && c.assignedTo !== params?.employeeId) {
          return false
        }

        return true
      })

      return Promise.resolve({
        cases: filteredCases,
        paging: generatePaging(filteredCases, page),
      })
    } catch (error) {
      throw new InternalServerErrorException('Internal server error.')
    }
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

  async getEditorialOverview(
    params?: GetCasesQuery,
  ): Promise<CaseEditorialOverview> {
    const submitted: Case[] = []
    const inProgress: Case[] = []
    const inReview: Case[] = []
    const ready: Case[] = []

    console.log(params?.status)

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

    const { cases, paging } = await this.getCases(params)

    console.log(cases)

    return Promise.resolve({
      data: cases,
      totalItems: {
        submitted: submitted.length,
        inProgress: inProgress.length,
        inReview: inReview.length,
        ready: ready.length,
      },
      paging,
    })
  }
}

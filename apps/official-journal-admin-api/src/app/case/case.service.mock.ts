import {
  BadRequestException,
  Inject,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { Case } from '../../dto/case/case.dto'

import { ICaseService } from './case.service.interface'
import { CasesReponse } from '../../dto/case/cases-response'
import { CasesQuery } from '../../dto/case/cases-query.dto'
import { generatePaging } from '@dmr.is/utils'
import { LOGGER_PROVIDER, Logger } from '@dmr.is/logging'
import { ALL_MOCK_CASES } from '@dmr.is/mocks'
import { CaseOverviewResponse } from '../../dto/case/case-overview.dto'
import { CaseStatus } from '../../dto/case/case-constants'

const MOCK_CASES = ALL_MOCK_CASES as Case[]

export class CaseServiceMock implements ICaseService {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {
    this.logger.info('Using CaseServiceMock')
  }
  getCase(id: string): Promise<Case | null> {
    const found = MOCK_CASES.find((c) => c.id === id)

    if (!found) {
      throw new NotFoundException('Case not found')
    }

    return Promise.resolve(found)
  }

  getCases(params?: CasesQuery): Promise<CasesReponse> {
    if (!params) {
      return Promise.resolve({
        cases: MOCK_CASES,
        paging: generatePaging(MOCK_CASES),
      })
    }

    try {
      const { page } = params

      const filteredCases = MOCK_CASES.filter((c) => {
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

        if (
          params?.institution &&
          (c.insititution.name !== params?.institution ||
            c.insititution.ssn !== params?.institution)
        ) {
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

  async getCasesOverview(params?: CasesQuery): Promise<CaseOverviewResponse> {
    const submitted: Case[] = []
    const inProgress: Case[] = []
    const inReview: Case[] = []
    const ready: Case[] = []

    console.log(params?.status)

    if (!params?.status) {
      throw new BadRequestException('Missing status')
    }

    MOCK_CASES.forEach((c) => {
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

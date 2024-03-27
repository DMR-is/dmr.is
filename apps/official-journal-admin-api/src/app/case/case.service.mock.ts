import {
  Inject,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'

import { Case, GetCasesReponse, GetCasesQuery } from '@dmr.is/shared/dto'
import { ICaseService } from './case.service.interface'

import { generatePaging } from '@dmr.is/utils'
import { LOGGER_PROVIDER, Logger } from '@dmr.is/logging'
import { ALL_MOCK_CASES } from '@dmr.is/mocks'

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
}

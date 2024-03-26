import {
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
}

import { InternalServerErrorException, NotFoundException } from '@nestjs/common'
import { Case } from '../../dto/case/case.dto'
import { ALL_MOCK_CASES } from '../../mock/case.mock'
import { ICaseService } from './case.service.interface'
import { CasesReponse } from '../../dto/case/cases-response'
import { CasesQuery } from '../../dto/case/cases-query.dto'
import { generatePaging } from '../../utils'

export class CaseServiceMock implements ICaseService {
  getCase(id: string): Promise<Case | null> {
    const found = ALL_MOCK_CASES.find((c) => c.id === id)

    if (!found) {
      throw new NotFoundException('Case not found')
    }

    return Promise.resolve(found)
  }

  getCases(params?: CasesQuery): Promise<CasesReponse> {
    console.log('params', params)

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

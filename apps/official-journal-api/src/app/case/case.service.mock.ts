import { NotFoundException } from '@nestjs/common'
import { Case } from '../../dto/case/case.dto'
import { ALL_MOCK_CASES } from '../../mock/case.mock'
import { ICaseService } from './case.service.interface'
import { CasesReponse } from '../../dto/case/cases-response'

export class CaseServiceMock implements ICaseService {
  getCase(id: string): Promise<Case | null> {
    const found = ALL_MOCK_CASES.find((c) => c.id === id)

    if (!found) {
      throw new NotFoundException('Case not found')
    }

    return Promise.resolve(found)
  }

  getCases(): Promise<CasesReponse> {
    return Promise.resolve({ cases: ALL_MOCK_CASES, paging: { total: ALL_MOCK_CASES.length, })
  }
}

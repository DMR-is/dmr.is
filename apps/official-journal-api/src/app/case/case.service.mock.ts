import { NotFoundException } from '@nestjs/common'
import { Case } from '../../dto/case/case.dto'
import { ALL_MOCK_CASES } from '../../mock/case.mock'
import { ICaseService } from './case.service.interface'

export class CaseServiceMock implements ICaseService {
  getCase(id: string): Promise<Case | null> {
    const found = ALL_MOCK_CASES.find((c) => c.id === id)

    if (!found) {
      throw new NotFoundException('Case not found')
    }

    return Promise.resolve(found)
  }
}

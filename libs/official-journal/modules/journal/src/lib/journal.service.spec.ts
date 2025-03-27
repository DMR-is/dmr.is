import { ResultWrapper } from '@dmr.is/types'

import { Test } from '@nestjs/testing'

import { IJournalService } from './journal.service.interface'
import { MockJournalService } from './journal.service.mock'

describe('JournalService', () => {
  let service: IJournalService

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      providers: [
        {
          provide: IJournalService,
          useClass: MockJournalService,
        },
      ],
    }).compile()

    service = app.get<IJournalService>(IJournalService)
  })

  describe('getAdverts', () => {
    it('should return two mock adverts', async () => {
      const results = ResultWrapper.unwrap(await service.getAdverts())
      expect(results.adverts.length).toEqual(2)
    })
  })
})

import { LOGGER_PROVIDER, LoggingModule } from '@dmr.is/logging'

import { Test } from '@nestjs/testing'

import { IJournalService } from './journal.service.interface'
import { MockJournalService } from './journal.service.mock'

describe('JournalService', () => {
  let service: IJournalService

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      imports: [LoggingModule],
      providers: [
        {
          provide: IJournalService,
          useClass: MockJournalService,
        },
        {
          provide: LOGGER_PROVIDER,
          useValue: {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile()

    service = app.get<IJournalService>(IJournalService)
  })

  describe('getAdverts', () => {
    it('should return two mock adverts', async () => {
      const results = await service.getAdverts()
      expect(results.ok && results?.value.adverts.length).toEqual(2)
    })
  })
})

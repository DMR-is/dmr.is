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
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile()

    service = app.get<IJournalService>(IJournalService)
  })

  describe('getData', () => {
    it('should return empty', async () => {
      const results = await service.getAdverts({})
      expect(results.length).toEqual(2)
    })
  })
})

import { Test, TestingModule } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'
import { JournalController } from './Journal.controller'
import { IJournalService } from './journal.service.interface'
import { MockJournalService } from './journal.service.mock'

describe('JournalController', () => {
  let journal: TestingModule

  beforeAll(async () => {
    journal = await Test.createTestingModule({
      controllers: [JournalController],
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
  })

  describe('getData', () => {
    it('should return "Hello API"', async () => {
      const journalController =
        journal.get<JournalController>(JournalController)

      const results = await journalController.adverts()
      expect(results.length).toEqual(2)
    })
  })
})

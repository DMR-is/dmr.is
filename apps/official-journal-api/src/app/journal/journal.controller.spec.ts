import { Test, TestingModule } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  CaseServiceMock,
  ICaseService,
  IJournalService,
  IReindexRunnerService,
  MockJournalService,
  MockRunnerService,
} from '@dmr.is/ojoi-modules'

import { JournalController } from './journal.controller'

import { Client } from '@opensearch-project/opensearch'
describe('JournalController', () => {
  let journal: TestingModule
  let journalController: JournalController
  beforeAll(async () => {
    journal = await Test.createTestingModule({
      controllers: [JournalController],
      providers: [
        {
          provide: IJournalService,
          useClass: MockJournalService,
        },
        {
          provide: ICaseService,
          useClass: CaseServiceMock,
        },
        {
          provide: IReindexRunnerService,
          useClass: MockRunnerService,
        },
        {
          provide: LOGGER_PROVIDER,
          useValue: {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
        {
          provide: Client,
          useValue: {},
        },
      ],
    }).compile()
    journalController = journal.get<JournalController>(JournalController)
  })
  describe('adverts', () => {
    it('should return correct amount of mocked adverts', async () => {
      const results = await journalController.adverts()
      expect(results.adverts.length).toEqual(2)
    })
    it('should return no results when searching for non-existing advert', async () => {
      const results = await journalController.adverts({ search: 'foo' })
      expect(results.adverts.length).toEqual(0)
    })
  })
  describe('advert', () => {
    it('should return correct advert', async () => {
      const results = await journalController.advert(
        'bcbefaf4-c021-4b63-877b-001dde880052',
      )
      expect(results.advert.id).toEqual('bcbefaf4-c021-4b63-877b-001dde880052')
    })
  })
  describe('departments', () => {
    it('should return correct amount of mocked departments', async () => {
      const results = await journalController.departments()
      expect(results.departments.length).toEqual(3)
    })
    it('should return no results when searching for non-existing department', async () => {
      const results = await journalController.departments({ search: 'foo' })
      expect(results.departments.length).toEqual(0)
    })
  })
})

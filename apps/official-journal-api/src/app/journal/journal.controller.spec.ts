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
import { LeanSearchTrackingService } from './lean-search-tracking.service'

import { Client } from '@opensearch-project/opensearch'
describe('JournalController', () => {
  let journal: TestingModule
  let journalController: JournalController
  const openSearchMock = {
    search: jest.fn(),
  }
  const leanSearchTrackingServiceMock = {
    track: jest.fn(),
  }

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
          useValue: openSearchMock,
        },
        {
          provide: LeanSearchTrackingService,
          useValue: leanSearchTrackingServiceMock,
        },
      ],
    }).compile()
    journalController = journal.get<JournalController>(JournalController)
  })

  beforeEach(() => {
    jest.clearAllMocks()
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

  describe('advertsLean', () => {
    it('should track a normal lean search', async () => {
      openSearchMock.search.mockResolvedValue({
        hits: {
          total: { value: 2 },
          hits: [
            { _id: '1', _score: 1.23, _source: { title: 'first' } },
            { _id: '2', _score: 0.75, _source: { title: 'second' } },
          ],
        },
      })

      const results = await journalController.advertsLean({ search: 'Test' })

      expect(results.adverts).toHaveLength(2)
      expect(leanSearchTrackingServiceMock.track).toHaveBeenCalledWith(
        { search: 'Test' },
        expect.objectContaining({
          page: 1,
          pageSize: 20,
          pageResultCount: 2,
          totalResultCount: 2,
          durationMs: expect.any(Number),
        }),
      )
    })

    it('should track zero-result lean searches', async () => {
      openSearchMock.search.mockResolvedValue({
        hits: {
          total: { value: 0 },
          hits: [],
        },
      })

      const results = await journalController.advertsLean({
        search: 'missing',
        page: 2,
        pageSize: 50,
      })

      expect(results.adverts).toHaveLength(0)
      expect(leanSearchTrackingServiceMock.track).toHaveBeenCalledWith(
        {
          search: 'missing',
          page: 2,
          pageSize: 50,
        },
        expect.objectContaining({
          page: 2,
          pageSize: 50,
          pageResultCount: 0,
          totalResultCount: 0,
          durationMs: expect.any(Number),
        }),
      )
    })

    it('should return results without waiting for tracking to finish', async () => {
      openSearchMock.search.mockResolvedValue({
        hits: {
          total: { value: 1 },
          hits: [{ _id: '1', _score: 1, _source: { title: 'first' } }],
        },
      })
      leanSearchTrackingServiceMock.track.mockReturnValue(
        new Promise(() => undefined),
      )

      await expect(
        journalController.advertsLean({ search: 'fast' }),
      ).resolves.toEqual({
        adverts: [{ id: '1', score: 1, title: 'first', highlight: undefined }],
        paging: {
          page: 1,
          totalPages: 1,
          totalItems: 1,
          nextPage: null,
          previousPage: null,
          pageSize: 20,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      })
    })
  })
})

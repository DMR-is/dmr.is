import { getModelToken } from '@nestjs/sequelize'
import { Test, TestingModule } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { AdvertModel } from '../../models/advert.model'
import { AdvertPublicationModel } from '../../models/advert-publication.model'
import { BackfilledPublicationModel } from '../../models/backfilled-publication.model'
import { HtmlAdminService } from './html-admin.service'

const mockLogger = {
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

const MOCK_USER = {
  adminUserId: 'admin-user-1',
  nationalId: '1234567890',
}

const MOCK_HTML = '<html><body>Test</body></html>'

const createMockPublication = (id: string, version = 'A') => ({
  id,
  advertId: `advert-${id}`,
  versionLetter: version,
  advert: {
    title: `Advert ${id}`,
    type: { title: 'Common' },
    htmlMarkup: jest.fn().mockReturnValue(MOCK_HTML),
  },
  update: jest.fn().mockResolvedValue(undefined),
})

describe('HtmlAdminService', () => {
  let service: HtmlAdminService
  let publicationModel: {
    count: jest.Mock
    findAll: jest.Mock
  }
  let backfilledModel: {
    count: jest.Mock
    findAll: jest.Mock
    findAndCountAll: jest.Mock
    bulkCreate: jest.Mock
  }

  beforeEach(async () => {
    jest
      .spyOn(AdvertModel, 'scope')
      .mockReturnValue(AdvertModel as typeof AdvertModel)

    const mockPublicationModel = {
      count: jest.fn(),
      findAll: jest.fn(),
    }

    const mockBackfilledModel = {
      count: jest.fn(),
      findAll: jest.fn(),
      findAndCountAll: jest.fn(),
      bulkCreate: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HtmlAdminService,
        {
          provide: getModelToken(AdvertPublicationModel),
          useValue: mockPublicationModel,
        },
        {
          provide: getModelToken(BackfilledPublicationModel),
          useValue: mockBackfilledModel,
        },
        {
          provide: LOGGER_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile()

    service = module.get<HtmlAdminService>(HtmlAdminService)
    publicationModel = mockPublicationModel
    backfilledModel = mockBackfilledModel
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('previewBackfill', () => {
    it('should return total count and preview items', async () => {
      publicationModel.count.mockResolvedValue(42)
      const mockPubs = [
        createMockPublication('pub-1'),
        createMockPublication('pub-2', 'B'),
      ]
      publicationModel.findAll.mockResolvedValue(mockPubs)

      const result = await service.previewBackfill(MOCK_USER as any)

      expect(result.dryRun).toBe(true)
      expect(result.total).toBe(42)
      expect(result.backfilled).toBe(42)
      expect(result.items).toHaveLength(2)
      expect(result.items[0].publicationId).toBe('pub-1')
      expect(result.items[0].success).toBe(true)
      expect(result.items[1].version).toBe('B')
    })

    it('should capture errors in preview items', async () => {
      publicationModel.count.mockResolvedValue(1)
      const badPub = createMockPublication('pub-bad')
      badPub.advert.htmlMarkup.mockImplementation(() => {
        throw new Error('Template error')
      })
      publicationModel.findAll.mockResolvedValue([badPub])

      const result = await service.previewBackfill(MOCK_USER as any)

      expect(result.items[0].success).toBe(false)
      expect(result.items[0].error).toBe('Template error')
    })
  })

  describe('startBackfill', () => {
    it('should return started: true and set state to running', () => {
      const result = service.startBackfill(MOCK_USER as any)

      expect(result.dryRun).toBe(false)
      expect(result.message).toBe('Backfill started')
    })

    it('should prevent concurrent runs', () => {
      service.startBackfill(MOCK_USER as any)
      const result = service.startBackfill(MOCK_USER as any)

      expect(result.message).toBe('Backfill is already running')
    })
  })

  describe('executeBackfill (via startBackfill)', () => {
    it('should process batches and record to backfilled table', async () => {
      const mockPubs = [
        createMockPublication('pub-1'),
        createMockPublication('pub-2'),
      ]
      publicationModel.count.mockResolvedValue(2)
      publicationModel.findAll
        .mockResolvedValueOnce(mockPubs)
        .mockResolvedValueOnce([])
      backfilledModel.bulkCreate.mockResolvedValue([])

      service.startBackfill(MOCK_USER as any)

      // Wait for setImmediate + async execution + batch delay
      await new Promise((r) => setTimeout(r, 100))

      const status = service.getBackfillStatus()
      expect(status.status).toBe('completed')
      expect(status.completed).toBe(2)
      expect(status.failed).toBe(0)

      expect(backfilledModel.bulkCreate).toHaveBeenCalledWith(
        [
          { publicationId: 'pub-1' },
          { publicationId: 'pub-2' },
        ],
        expect.objectContaining({ transaction: null }),
      )
    })

    it('should handle individual publication failures', async () => {
      const goodPub = createMockPublication('pub-good')
      const badPub = createMockPublication('pub-bad')
      badPub.advert.htmlMarkup.mockImplementation(() => {
        throw new Error('Generation failed')
      })

      publicationModel.count.mockResolvedValue(2)
      publicationModel.findAll
        .mockResolvedValueOnce([goodPub, badPub])
        .mockResolvedValueOnce([])
      backfilledModel.bulkCreate.mockResolvedValue([])

      service.startBackfill(MOCK_USER as any)
      await new Promise((r) => setTimeout(r, 100))

      const status = service.getBackfillStatus()
      expect(status.completed).toBe(1)
      expect(status.failed).toBe(1)

      // Only successful one recorded
      expect(backfilledModel.bulkCreate).toHaveBeenCalledWith(
        [{ publicationId: 'pub-good' }],
        expect.objectContaining({ transaction: null }),
      )
    })

    it('should release lock after completion', async () => {
      publicationModel.count.mockResolvedValue(0)

      service.startBackfill(MOCK_USER as any)
      await new Promise((r) => setTimeout(r, 100))

      // Should be able to start again
      const result = service.startBackfill(MOCK_USER as any)
      expect(result.message).toBe('Backfill started')
    })

    it('should release lock on failure', async () => {
      publicationModel.count.mockRejectedValue(new Error('DB down'))

      service.startBackfill(MOCK_USER as any)
      await new Promise((r) => setTimeout(r, 100))

      const status = service.getBackfillStatus()
      expect(status.status).toBe('failed')

      const result = service.startBackfill(MOCK_USER as any)
      expect(result.message).toBe('Backfill started')
    })
  })

  describe('getBackfillStatus', () => {
    it('should return idle by default', () => {
      const status = service.getBackfillStatus()
      expect(status.status).toBe('idle')
      expect(status.total).toBe(0)
    })

    it('should return a copy (not a reference)', () => {
      const s1 = service.getBackfillStatus()
      const s2 = service.getBackfillStatus()
      expect(s1).not.toBe(s2)
      expect(s1).toEqual(s2)
    })
  })

  describe('getBackfilledPublications', () => {
    it('should return paginated results', async () => {
      backfilledModel.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: [
          {
            id: 'bf-1',
            publicationId: 'pub-1',
            createdAt: new Date('2026-04-14'),
            publication: {
              versionLetter: 'A',
              advert: { title: 'Test', type: { title: 'Common' } },
            },
          },
        ],
      })

      const result = await service.getBackfilledPublications({
        page: 1,
        pageSize: 10,
      })

      expect(result.total).toBe(1)
      expect(result.page).toBe(1)
      expect(result.items[0].title).toBe('Test')
      expect(result.items[0].version).toBe('A')
    })
  })

  describe('startRevert', () => {
    it('should return started: true', () => {
      const result = service.startRevert(MOCK_USER as any)
      expect(result.started).toBe(true)
      expect(result.status.status).toBe('running')
    })

    it('should prevent concurrent reverts', () => {
      service.startRevert(MOCK_USER as any)
      const result = service.startRevert(MOCK_USER as any)
      expect(result.started).toBe(false)
    })
  })
})

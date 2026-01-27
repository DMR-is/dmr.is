import { Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'

import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { getModelToken } from '@nestjs/sequelize'
import { Test, TestingModule } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { LegalGazetteEvents } from '../../../../core/constants'
import { AdvertModel } from '../../../../models/advert.model'
import {
  AdvertPublicationModel,
  AdvertVersionEnum,
} from '../../../../models/advert-publication.model'
import { StatusIdEnum } from '../../../../models/status.model'
import { PgAdvisoryLockService } from '../lock.service'
import { PublishingTaskService } from './publishing.task'

describe('PublishingTaskService - Event Emission', () => {
  let service: PublishingTaskService
  let eventEmitter: jest.Mocked<EventEmitter2>
  let publicationModel: jest.Mocked<typeof AdvertPublicationModel>
  let advertModel: jest.Mocked<typeof AdvertModel>
  let sequelize: jest.Mocked<Sequelize>
  let mockLogger: Record<string, jest.Mock>

  // Test data factories
  const createMockAdvert = (overrides = {}) => ({
    id: 'advert-123',
    title: 'Test Advert',
    publicationNumber: '',
    type: { title: 'Skipti' },
    fromModelToDetailed: jest.fn().mockReturnValue({
      id: 'advert-123',
      title: 'Test Advert',
    }),
    htmlMarkup: jest.fn().mockReturnValue('<html>Test</html>'),
    update: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  })

  const createMockPublication = (overrides = {}) => ({
    id: 'publication-123',
    advertId: 'advert-123',
    version: AdvertVersionEnum.A,
    scheduledAt: new Date('2026-01-14T10:00:00Z'),
    publishedAt: null,
    advert: createMockAdvert(),
    fromModel: jest.fn().mockReturnValue({
      id: 'publication-123',
      advertId: 'advert-123',
      version: AdvertVersionEnum.A,
    }),
    update: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  })

  beforeEach(async () => {
    jest.clearAllMocks()

    // Mock AdvertModel.scope static method to avoid initialization error
    jest
      .spyOn(AdvertModel, 'scope')
      .mockReturnValue(AdvertModel as unknown as typeof AdvertModel)

    // Mock logger
    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }

    // Mock EventEmitter2
    const mockEventEmitter = {
      emit: jest.fn().mockReturnValue(true),
      emitAsync: jest.fn().mockResolvedValue([]),
    }

    // Mock Sequelize transaction
    const mockTransaction = jest.fn().mockImplementation(async (callback) => {
      const transactionObj = {
        commit: jest.fn(),
        rollback: jest.fn(),
      }
      return callback(transactionObj)
    })

    const mockSequelize = {
      transaction: mockTransaction,
      query: jest.fn(),
    }

    // Mock models
    const mockPublicationModel = {
      findAll: jest.fn(),
    }

    const mockAdvertModel = {
      findOne: jest.fn(),
      scope: jest.fn().mockReturnValue(AdvertModel), // Mock static scope method
    }

    // Mock lock service
    const mockLockService = {
      runWithSessionLock: jest.fn().mockImplementation(async (lockKey, fn) => {
        await fn()
        return { ran: true }
      }),
    }

    // Mock cache manager
    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      reset: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublishingTaskService,
        {
          provide: LOGGER_PROVIDER,
          useValue: mockLogger,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
        {
          provide: getModelToken(AdvertModel),
          useValue: mockAdvertModel,
        },
        {
          provide: getModelToken(AdvertPublicationModel),
          useValue: mockPublicationModel,
        },
        {
          provide: Sequelize,
          useValue: mockSequelize,
        },
        {
          provide: PgAdvisoryLockService,
          useValue: mockLockService,
        },
      ],
    }).compile()

    service = module.get<PublishingTaskService>(PublishingTaskService)
    eventEmitter = module.get(EventEmitter2)
    publicationModel = module.get(getModelToken(AdvertPublicationModel))
    advertModel = module.get(getModelToken(AdvertModel))
    sequelize = module.get(Sequelize)
  })

  describe('Event Emission with emitAsync', () => {
    it('should use emitAsync for ADVERT_PUBLISHED event', async () => {
      const mockPublication = createMockPublication()
      publicationModel.findAll.mockResolvedValue([
        mockPublication,
      ] as unknown as AdvertPublicationModel[])
      advertModel.findOne.mockResolvedValue(null)

      await service.publishAdverts()

      expect(eventEmitter.emitAsync).toHaveBeenCalledWith(
        LegalGazetteEvents.ADVERT_PUBLISHED,
        expect.objectContaining({
          advert: expect.any(Object),
          publication: expect.any(Object),
          html: expect.any(String),
        }),
      )
    })

    it('should use regular emit for ADVERT_PUBLISHED_SIDE_EFFECTS event', async () => {
      const mockPublication = createMockPublication()
      publicationModel.findAll.mockResolvedValue([
        mockPublication,
      ] as unknown as AdvertPublicationModel[])

      await service.publishAdverts()

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        LegalGazetteEvents.ADVERT_PUBLISHED_SIDE_EFFECTS,
        expect.objectContaining({
          advert: expect.any(Object),
          publication: expect.any(Object),
          html: expect.any(String),
        }),
      )
    })

    it('should await emitAsync before committing transaction', async () => {
      const mockPublication = createMockPublication()
      publicationModel.findAll.mockResolvedValue([
        mockPublication,
      ] as unknown as AdvertPublicationModel[])

      const emitOrder: string[] = []
      eventEmitter.emitAsync.mockImplementation(async () => {
        emitOrder.push('emitAsync')
        return []
      })

      // Mock transaction to track commit timing
      ;(sequelize.transaction as jest.Mock).mockImplementation(
        async (callback: (t: Transaction) => Promise<void>) => {
          const tx = {
            commit: jest.fn(),
            rollback: jest.fn(),
          } as unknown as Transaction
          await callback(tx)
          emitOrder.push('commit')
          return tx
        },
      )

      await service.publishAdverts()

      // emitAsync should be called before transaction commits
      expect(emitOrder).toEqual(['emitAsync', 'commit'])
    })

    it('should catch and log errors from emitAsync', async () => {
      const mockPublication = createMockPublication()
      publicationModel.findAll.mockResolvedValue([
        mockPublication,
      ] as unknown as AdvertPublicationModel[])

      const testError = new Error('TBR payment failed')
      eventEmitter.emitAsync.mockRejectedValue(testError)

      await service.publishAdverts()

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error occurred while emitting ADVERT_PUBLISHED event',
        expect.objectContaining({
          context: 'PublicationService',
          advertId: 'advert-123',
          publicationId: 'publication-123',
          error: 'TBR payment failed',
        }),
      )
    })

    it('should rollback transaction when emitAsync throws', async () => {
      const mockPublication = createMockPublication()
      publicationModel.findAll.mockResolvedValue([
        mockPublication,
      ] as unknown as AdvertPublicationModel[])

      const testError = new Error('TBR payment failed')
      eventEmitter.emitAsync.mockRejectedValue(testError)
      ;(sequelize.transaction as jest.Mock).mockImplementation(
        async (callback: (t: Transaction) => Promise<void>) => {
          const tx = {
            commit: jest.fn(),
            rollback: jest.fn(),
          } as unknown as Transaction
          await callback(tx)
          return tx
        },
      )

      await service.publishAdverts()

      // Publication should not be marked as published if transaction rolls back
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to publish advert publication',
        expect.any(Object),
      )
    })

    it('should continue processing remaining publications if one fails', async () => {
      const mockPub1 = createMockPublication({ id: 'pub-1' })
      const mockPub2 = createMockPublication({ id: 'pub-2' })
      publicationModel.findAll.mockResolvedValue([
        mockPub1,
        mockPub2,
      ] as unknown as AdvertPublicationModel[])

      // Make first emission fail, second succeed
      eventEmitter.emitAsync
        .mockRejectedValueOnce(new Error('First failed'))
        .mockResolvedValueOnce([])

      await service.publishAdverts()

      // Should have tried to emit twice
      expect(eventEmitter.emitAsync).toHaveBeenCalledTimes(2)
      // Should have logged error for first
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to publish advert publication',
        expect.objectContaining({
          publicationId: 'pub-1',
        }),
      )
      // Should have logged success for second
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Published advert publication with ID: pub-2',
        expect.any(Object),
      )
    })
  })

  describe('Multiple Publications with Correct Adverts', () => {
    it('should fetch each publication with its own advert', async () => {
      const advert1 = createMockAdvert({ id: 'advert-1', title: 'Advert 1' })
      const advert2 = createMockAdvert({ id: 'advert-2', title: 'Advert 2' })

      const pub1 = createMockPublication({
        id: 'pub-1',
        advertId: 'advert-1',
        advert: advert1,
      })
      const pub2 = createMockPublication({
        id: 'pub-2',
        advertId: 'advert-2',
        advert: advert2,
      })

      publicationModel.findAll.mockResolvedValue([
        pub1,
        pub2,
      ] as unknown as AdvertPublicationModel[])

      await service.publishAdverts()

      // Should process both publications
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Processing publication 1 of 2',
        expect.objectContaining({
          advertId: 'advert-1',
          publicationId: 'pub-1',
        }),
      )

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Processing publication 2 of 2',
        expect.objectContaining({
          advertId: 'advert-2',
          publicationId: 'pub-2',
        }),
      )

      // Should emit events for both adverts
      expect(eventEmitter.emitAsync).toHaveBeenCalledTimes(2)
    })

    it('should include advert model in findAll query with statusId filter', async () => {
      publicationModel.findAll.mockResolvedValue([])

      await service.publishAdverts()

      expect(publicationModel.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          include: [
            {
              model: expect.anything(),
              as: 'advert',
              where: {
                statusId: StatusIdEnum.READY_FOR_PUBLICATION,
              },
            },
          ],
        }),
      )
    })
  })

  describe('Publication Number Generation', () => {
    it('should not use Transaction.LOCK.UPDATE', async () => {
      const mockPublication = createMockPublication()
      publicationModel.findAll.mockResolvedValue([
        mockPublication,
      ] as unknown as AdvertPublicationModel[])
      advertModel.findOne.mockResolvedValue(null)

      await service.publishAdverts()

      // Verify findOne was called without lock parameter
      expect(advertModel.findOne).toHaveBeenCalledWith(
        expect.not.objectContaining({
          lock: expect.anything(),
        }),
      )
    })
  })

  describe('Publication Update Pattern', () => {
    it('should use publication.update() instead of save()', async () => {
      const mockPublication = createMockPublication()
      publicationModel.findAll.mockResolvedValue([
        mockPublication,
      ] as unknown as AdvertPublicationModel[])

      await service.publishAdverts()

      expect(mockPublication.update).toHaveBeenCalledWith(
        { publishedAt: expect.any(Date) },
        { transaction: expect.any(Object) },
      )
    })

    it('should update publication with current timestamp', async () => {
      const mockPublication = createMockPublication()
      publicationModel.findAll.mockResolvedValue([
        mockPublication,
      ] as unknown as AdvertPublicationModel[])

      const beforeTime = Date.now()
      await service.publishAdverts()
      const afterTime = Date.now()

      const updateCall = mockPublication.update.mock.calls[0]
      const publishedAt = updateCall[0].publishedAt.getTime()

      expect(publishedAt).toBeGreaterThanOrEqual(beforeTime)
      expect(publishedAt).toBeLessThanOrEqual(afterTime)
    })
  })

  describe('Error Scenarios', () => {
    it('should handle no publications gracefully', async () => {
      publicationModel.findAll.mockResolvedValue(
        [] as unknown as AdvertPublicationModel[],
      )

      await service.publishAdverts()

      expect(mockLogger.info).toHaveBeenCalledWith(
        'No publications to be published at this time, skipping job',
        expect.any(Object),
      )
      expect(eventEmitter.emitAsync).not.toHaveBeenCalled()
    })

    it('should log error details when event emission fails', async () => {
      const mockPublication = createMockPublication()
      publicationModel.findAll.mockResolvedValue([
        mockPublication,
      ] as unknown as AdvertPublicationModel[])

      const customError = new Error('Custom TBR error')
      eventEmitter.emitAsync.mockRejectedValue(customError)

      await service.publishAdverts()

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error occurred while emitting ADVERT_PUBLISHED event',
        expect.objectContaining({
          error: 'Custom TBR error',
        }),
      )
    })
  })

  describe('Transaction Semantics', () => {
    it('should emit events INSIDE transaction, not in afterCommit', async () => {
      const mockPublication = createMockPublication()
      publicationModel.findAll.mockResolvedValue([
        mockPublication,
      ] as unknown as AdvertPublicationModel[])

      let emitCalledInsideTransaction = false
      let transactionCompleted = false

      // Mock transaction that tracks callback execution
      ;(sequelize.transaction as jest.Mock).mockImplementation(
        async (callback: (t: Transaction) => Promise<void>) => {
          const tx = {
            commit: jest.fn(),
            rollback: jest.fn(),
          } as unknown as Transaction
          await callback(tx)
          transactionCompleted = true
          return tx
        },
      )

      eventEmitter.emitAsync.mockImplementation(async () => {
        emitCalledInsideTransaction = !transactionCompleted
        return []
      })

      await service.publishAdverts()

      // Event should be emitted before transaction completes
      expect(emitCalledInsideTransaction).toBe(true)
    })
  })
})

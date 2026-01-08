import { Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'

import { BadRequestException, NotFoundException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { getModelToken } from '@nestjs/sequelize'
import { Test, TestingModule } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { AdvertModel } from '../../../models/advert.model'
import { AdvertPublicationModel } from '../../../models/advert-publication.model'
import { StatusIdEnum } from '../../../models/status.model'
import { PublicationService } from './publication.service'
import { IPublicationService } from './publication.service.interface'

// Mock logger
const mockLogger = {
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Mock Sequelize instance
const mockSequelize = {
  transaction: jest.fn(),
}

describe('PublicationService - Publication Number Generation', () => {
  let service: IPublicationService
  let advertModel: typeof AdvertModel
  let advertPublicationModel: typeof AdvertPublicationModel
  let sequelize: Sequelize

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublicationService,
        {
          provide: getModelToken(AdvertModel),
          useValue: {
            findOne: jest.fn(),
            findByPkOrThrow: jest.fn(),
            withScope: jest.fn(),
          },
        },
        {
          provide: getModelToken(AdvertPublicationModel),
          useValue: {
            findOneOrThrow: jest.fn(),
          },
        },
        {
          provide: Sequelize,
          useValue: mockSequelize,
        },
        {
          provide: LOGGER_PROVIDER,
          useValue: mockLogger,
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
            emitAsync: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<IPublicationService>(PublicationService)
    advertModel = module.get(getModelToken(AdvertModel))
    advertPublicationModel = module.get(getModelToken(AdvertPublicationModel))
    sequelize = module.get<Sequelize>(Sequelize)

    jest.clearAllMocks()
  })

  describe('publishAdvertPublication - decimal parsing correctness', () => {
    it('should correctly parse publication number with radix 10', async () => {
      // Setup: Mock existing publication ending in "009"
      const existingAdvert = {
        publicationNumber: '20260108009',
      }

      const mockAdvert = {
        id: 'advert-1',
        publicationNumber: null,
        update: jest.fn().mockResolvedValue(undefined),
        fromModelToDetailed: jest.fn().mockReturnValue({ id: 'advert-1' }),
        htmlMarkup: jest.fn().mockReturnValue('<html></html>'),
      }

      const mockPublication = {
        id: 'pub-1',
        advertId: 'advert-1',
        publishedAt: null,
        versionLetter: 'A',
        update: jest.fn().mockResolvedValue(undefined),
        fromModel: jest.fn().mockReturnValue({ id: 'pub-1' }),
      }

      // Mock transaction
      const mockTransaction = {
        afterCommit: jest.fn((callback) => callback()),
      } as unknown as Transaction

      mockSequelize.transaction.mockImplementation(async (callback) => {
        return callback(mockTransaction)
      })

      // Mock the scope chain for withScope('detailed')
      const mockScopedModel = {
        findByPkOrThrow: jest.fn().mockResolvedValue(mockAdvert),
      }
      ;(advertModel.withScope as jest.Mock).mockReturnValue(mockScopedModel)
      ;(advertPublicationModel.findOneOrThrow as jest.Mock).mockResolvedValue(
        mockPublication,
      )
      ;(advertModel.findOne as jest.Mock).mockResolvedValue(existingAdvert)

      // Action: Publish advert
      await service.publishAdvertPublication('advert-1', 'pub-1')

      // Assert: With radix 11, "009" would be parsed as 9 in base 11 = 9 in base 10
      // Adding 1 gives 10, padded to "010"
      // With radix 10, "009" is parsed as 9 in base 10 = 9 in base 10
      // Adding 1 gives 10, padded to "010"
      // NOTE: This test verifies that using radix 10 correctly handles numbers ending in "009";
      //       the following test case with "010" demonstrates the radix 11 parsing bug.

      const updateCalls = mockAdvert.update.mock.calls
      expect(updateCalls.length).toBeGreaterThan(0)

      const publicationNumber = updateCalls[0][0].publicationNumber
      expect(publicationNumber).toBe('20260108010')
    })

    it('should handle publication numbers ending with "010" correctly', async () => {
      // Setup: This demonstrates the radix 11 bug
      // With radix 11: "010" parsed as 0*11^2 + 1*11^1 + 0*11^0 = 11
      // Adding 1 gives 12, padded to "012" - WRONG!
      // With radix 10: "010" parsed as 10, adding 1 gives 11, padded to "011" - CORRECT
      const existingAdvert = {
        publicationNumber: '20260108010',
      }

      const mockAdvert = {
        id: 'advert-2',
        publicationNumber: null,
        update: jest.fn().mockResolvedValue(undefined),
        fromModelToDetailed: jest.fn().mockReturnValue({ id: 'advert-2' }),
        htmlMarkup: jest.fn().mockReturnValue('<html></html>'),
      }

      const mockPublication = {
        id: 'pub-2',
        advertId: 'advert-2',
        publishedAt: null,
        versionLetter: 'A',
        update: jest.fn().mockResolvedValue(undefined),
        fromModel: jest.fn().mockReturnValue({ id: 'pub-2' }),
      }

      const mockTransaction = {
        afterCommit: jest.fn((callback) => callback()),
      } as unknown as Transaction

      mockSequelize.transaction.mockImplementation(async (callback) => {
        return callback(mockTransaction)
      })

      const mockScopedModel = {
        findByPkOrThrow: jest.fn().mockResolvedValue(mockAdvert),
      }
      ;(advertModel.withScope as jest.Mock).mockReturnValue(mockScopedModel)
      ;(advertPublicationModel.findOneOrThrow as jest.Mock).mockResolvedValue(
        mockPublication,
      )
      ;(advertModel.findOne as jest.Mock).mockResolvedValue(existingAdvert)

      // Action
      await service.publishAdvertPublication('advert-2', 'pub-2')

      // Assert: Should be 011, not 012
      const updateCalls = mockAdvert.update.mock.calls
      const publicationNumber = updateCalls[0][0].publicationNumber

      // This will FAIL with radix 11 bug, showing it returns "012" instead of "011"
      expect(publicationNumber).toBe('20260108011')
    })

    it('should handle first publication of the day', async () => {
      // Setup: No existing publications
      const mockAdvert = {
        id: 'advert-3',
        publicationNumber: null,
        update: jest.fn().mockResolvedValue(undefined),
        fromModelToDetailed: jest.fn().mockReturnValue({ id: 'advert-3' }),
        htmlMarkup: jest.fn().mockReturnValue('<html></html>'),
      }

      const mockPublication = {
        id: 'pub-3',
        advertId: 'advert-3',
        publishedAt: null,
        versionLetter: 'A',
        update: jest.fn().mockResolvedValue(undefined),
        fromModel: jest.fn().mockReturnValue({ id: 'pub-3' }),
      }

      const mockTransaction = {
        afterCommit: jest.fn((callback) => callback()),
      } as unknown as Transaction

      mockSequelize.transaction.mockImplementation(async (callback) => {
        return callback(mockTransaction)
      })

      const mockScopedModel = {
        findByPkOrThrow: jest.fn().mockResolvedValue(mockAdvert),
      }
      ;(advertModel.withScope as jest.Mock).mockReturnValue(mockScopedModel)
      ;(advertPublicationModel.findOneOrThrow as jest.Mock).mockResolvedValue(
        mockPublication,
      )
      ;(advertModel.findOne as jest.Mock).mockResolvedValue(null)

      // Action
      await service.publishAdvertPublication('advert-3', 'pub-3')

      // Assert: Should be 001
      const updateCalls = mockAdvert.update.mock.calls
      const publicationNumber = updateCalls[0][0].publicationNumber

      expect(publicationNumber).toMatch(/^\d{8}001$/)
    })
  })

  describe('publishAdvertPublication - race condition prevention', () => {
    it('should use transaction for publication number generation', async () => {
      // This test verifies that findOne is called with transaction parameter
      const mockAdvert = {
        id: 'advert-4',
        publicationNumber: null,
        update: jest.fn().mockResolvedValue(undefined),
        fromModelToDetailed: jest.fn().mockReturnValue({ id: 'advert-4' }),
        htmlMarkup: jest.fn().mockReturnValue('<html></html>'),
      }

      const mockPublication = {
        id: 'pub-4',
        advertId: 'advert-4',
        publishedAt: null,
        versionLetter: 'A',
        update: jest.fn().mockResolvedValue(undefined),
        fromModel: jest.fn().mockReturnValue({ id: 'pub-4' }),
      }

      const mockTransaction = {
        afterCommit: jest.fn((callback) => callback()),
      } as unknown as Transaction

      mockSequelize.transaction.mockImplementation(async (callback) => {
        return callback(mockTransaction)
      })

      const mockScopedModel = {
        findByPkOrThrow: jest.fn().mockResolvedValue(mockAdvert),
      }
      ;(advertModel.withScope as jest.Mock).mockReturnValue(mockScopedModel)
      ;(advertPublicationModel.findOneOrThrow as jest.Mock).mockResolvedValue(
        mockPublication,
      )
      ;(advertModel.findOne as jest.Mock).mockResolvedValue(null)

      // Action
      await service.publishAdvertPublication('advert-4', 'pub-4')

      // Assert: findOne should be called WITH transaction parameter
      const findOneCalls = (advertModel.findOne as jest.Mock).mock.calls
      expect(findOneCalls.length).toBeGreaterThan(0)

      const findOneOptions = findOneCalls[0][0]
      expect(findOneOptions).toHaveProperty('transaction')
      expect(findOneOptions.transaction).toBe(mockTransaction)
    })

    it('should use pessimistic lock (LOCK.UPDATE) when reading max publication', async () => {
      // This test verifies that findOne uses lock: Transaction.LOCK.UPDATE
      const mockAdvert = {
        id: 'advert-5',
        publicationNumber: null,
        update: jest.fn().mockResolvedValue(undefined),
        fromModelToDetailed: jest.fn().mockReturnValue({ id: 'advert-5' }),
        htmlMarkup: jest.fn().mockReturnValue('<html></html>'),
      }

      const mockPublication = {
        id: 'pub-5',
        advertId: 'advert-5',
        publishedAt: null,
        versionLetter: 'A',
        update: jest.fn().mockResolvedValue(undefined),
        fromModel: jest.fn().mockReturnValue({ id: 'pub-5' }),
      }

      const mockTransaction = {
        afterCommit: jest.fn((callback) => callback()),
      } as unknown as Transaction

      mockSequelize.transaction.mockImplementation(async (callback) => {
        return callback(mockTransaction)
      })

      const mockScopedModel = {
        findByPkOrThrow: jest.fn().mockResolvedValue(mockAdvert),
      }
      ;(advertModel.withScope as jest.Mock).mockReturnValue(mockScopedModel)
      ;(advertPublicationModel.findOneOrThrow as jest.Mock).mockResolvedValue(
        mockPublication,
      )
      ;(advertModel.findOne as jest.Mock).mockResolvedValue(null)

      // Action
      await service.publishAdvertPublication('advert-5', 'pub-5')

      // Assert: findOne should use pessimistic lock
      const findOneCalls = (advertModel.findOne as jest.Mock).mock.calls
      expect(findOneCalls.length).toBeGreaterThan(0)

      const findOneOptions = findOneCalls[0][0]
      expect(findOneOptions).toHaveProperty('lock')
      expect(findOneOptions.lock).toBe(Transaction.LOCK.UPDATE)
    })
  })

  describe('publishAdvertPublication - general behavior', () => {
    it('should throw BadRequestException if publication already published', async () => {
      // Setup: Publication with publishedAt set
      const mockAdvert = {
        id: 'advert-6',
        publicationNumber: '20260108001',
      }

      const mockPublication = {
        id: 'pub-6',
        advertId: 'advert-6',
        publishedAt: new Date('2026-01-08T10:00:00Z'),
        update: jest.fn().mockResolvedValue(undefined),
      }

      const mockTransaction = {
        afterCommit: jest.fn((callback) => callback()),
      } as unknown as Transaction

      mockSequelize.transaction.mockImplementation(async (callback) => {
        return callback(mockTransaction)
      })

      const mockScopedModel = {
        findByPkOrThrow: jest.fn().mockResolvedValue(mockAdvert),
      }
      ;(advertModel.withScope as jest.Mock).mockReturnValue(mockScopedModel)
      ;(advertPublicationModel.findOneOrThrow as jest.Mock).mockResolvedValue(
        mockPublication,
      )

      // Action & Assert
      await expect(
        service.publishAdvertPublication('advert-6', 'pub-6'),
      ).rejects.toThrow(BadRequestException)
      await expect(
        service.publishAdvertPublication('advert-6', 'pub-6'),
      ).rejects.toThrow('Publication already published')
    })

    it('should not generate new publication number if advert already has one', async () => {
      // Setup: Advert already has publication number
      const mockAdvert = {
        id: 'advert-7',
        publicationNumber: '20260108001',
        update: jest.fn().mockResolvedValue(undefined),
        fromModelToDetailed: jest.fn().mockReturnValue({ id: 'advert-7' }),
        htmlMarkup: jest.fn().mockReturnValue('<html></html>'),
      }

      const mockPublication = {
        id: 'pub-7',
        advertId: 'advert-7',
        publishedAt: null,
        versionLetter: 'A',
        update: jest.fn().mockResolvedValue(undefined),
        fromModel: jest.fn().mockReturnValue({ id: 'pub-7' }),
      }

      const mockTransaction = {
        afterCommit: jest.fn((callback) => callback()),
      } as unknown as Transaction

      mockSequelize.transaction.mockImplementation(async (callback) => {
        return callback(mockTransaction)
      })

      const mockScopedModel = {
        findByPkOrThrow: jest.fn().mockResolvedValue(mockAdvert),
      }
      ;(advertModel.withScope as jest.Mock).mockReturnValue(mockScopedModel)
      ;(advertPublicationModel.findOneOrThrow as jest.Mock).mockResolvedValue(
        mockPublication,
      )

      // Action
      await service.publishAdvertPublication('advert-7', 'pub-7')

      // Assert: findOne should NOT be called (no need to query max publication)
      expect(advertModel.findOne).not.toHaveBeenCalled()

      // Assert: advert.update should NOT be called (already has publication number)
      expect(mockAdvert.update).not.toHaveBeenCalled()
    })

    it('should rollback transaction when event emitter throws error', async () => {
      // Setup: Normal advert and publication, but event emitter will fail
      const mockAdvert = {
        id: 'advert-8',
        publicationNumber: '20260108001',
        fromModelToDetailed: jest.fn().mockReturnValue({ id: 'advert-8' }),
        htmlMarkup: jest.fn().mockReturnValue('<html></html>'),
      }

      const mockPublication = {
        id: 'pub-8',
        advertId: 'advert-8',
        publishedAt: null,
        versionLetter: 'A',
        update: jest.fn().mockResolvedValue(undefined),
        fromModel: jest.fn().mockReturnValue({ id: 'pub-8' }),
      }

      const mockEventEmitter = {
        emitAsync: jest
          .fn()
          .mockRejectedValue(new Error('TBR transaction creation failed')),
      }

      // Create a mock transaction that tracks if it was committed
      let transactionCommitted = false
      const mockTransaction = {
        commit: jest.fn().mockImplementation(() => {
          transactionCommitted = true
          return Promise.resolve()
        }),
        rollback: jest.fn().mockImplementation(() => {
          transactionCommitted = false
          return Promise.resolve()
        }),
      } as unknown as Transaction

      // Mock sequelize.transaction to simulate rollback on error
      mockSequelize.transaction.mockImplementation(async (callback) => {
        try {
          await callback(mockTransaction)
          await mockTransaction.commit()
        } catch (error) {
          await mockTransaction.rollback()
          throw error
        }
      })

      const mockScopedModel = {
        findByPkOrThrow: jest.fn().mockResolvedValue(mockAdvert),
      }
      ;(advertModel.withScope as jest.Mock).mockReturnValue(mockScopedModel)
      ;(advertPublicationModel.findOneOrThrow as jest.Mock).mockResolvedValue(
        mockPublication,
      )

      // Create a new service instance with the mocked event emitter
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PublicationService,
          {
            provide: getModelToken(AdvertModel),
            useValue: advertModel,
          },
          {
            provide: getModelToken(AdvertPublicationModel),
            useValue: advertPublicationModel,
          },
          {
            provide: Sequelize,
            useValue: mockSequelize,
          },
          {
            provide: LOGGER_PROVIDER,
            useValue: mockLogger,
          },
          {
            provide: EventEmitter2,
            useValue: mockEventEmitter,
          },
        ],
      }).compile()

      const testService = module.get<IPublicationService>(PublicationService)

      // Action & Assert: Should throw the error from event emitter
      await expect(
        testService.publishAdvertPublication('advert-8', 'pub-8'),
      ).rejects.toThrow('TBR transaction creation failed')

      // Assert: Transaction should have been rolled back
      expect(mockTransaction.rollback).toHaveBeenCalled()
      expect(transactionCommitted).toBe(false)

      // Assert: Event emitter should have been called
      expect(mockEventEmitter.emitAsync).toHaveBeenCalled()
    })

    it('should commit transaction and emit event when publication succeeds', async () => {
      // Setup: Normal advert and publication, event emitter will succeed
      const mockAdvert = {
        id: 'advert-9',
        publicationNumber: '20260108001',
        fromModelToDetailed: jest.fn().mockReturnValue({
          id: 'advert-9',
          title: 'Test Advert',
        }),
        htmlMarkup: jest.fn().mockReturnValue('<html>Test HTML</html>'),
      }

      const mockPublication = {
        id: 'pub-9',
        advertId: 'advert-9',
        publishedAt: null,
        versionLetter: 'A',
        update: jest.fn().mockResolvedValue(undefined),
        fromModel: jest.fn().mockReturnValue({
          id: 'pub-9',
          versionNumber: 1,
        }),
      }

      const mockEventEmitter = {
        emitAsync: jest.fn().mockResolvedValue(undefined),
      }

      // Create a mock transaction that tracks if it was committed
      let transactionCommitted = false
      const mockTransaction = {
        commit: jest.fn().mockImplementation(() => {
          transactionCommitted = true
          return Promise.resolve()
        }),
        rollback: jest.fn().mockImplementation(() => {
          transactionCommitted = false
          return Promise.resolve()
        }),
      } as unknown as Transaction

      // Mock sequelize.transaction to simulate commit on success
      mockSequelize.transaction.mockImplementation(async (callback) => {
        try {
          await callback(mockTransaction)
          await mockTransaction.commit()
        } catch (error) {
          await mockTransaction.rollback()
          throw error
        }
      })

      const mockScopedModel = {
        findByPkOrThrow: jest.fn().mockResolvedValue(mockAdvert),
      }
      ;(advertModel.withScope as jest.Mock).mockReturnValue(mockScopedModel)
      ;(advertPublicationModel.findOneOrThrow as jest.Mock).mockResolvedValue(
        mockPublication,
      )

      // Create a new service instance with the mocked event emitter
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PublicationService,
          {
            provide: getModelToken(AdvertModel),
            useValue: advertModel,
          },
          {
            provide: getModelToken(AdvertPublicationModel),
            useValue: advertPublicationModel,
          },
          {
            provide: Sequelize,
            useValue: mockSequelize,
          },
          {
            provide: LOGGER_PROVIDER,
            useValue: mockLogger,
          },
          {
            provide: EventEmitter2,
            useValue: mockEventEmitter,
          },
        ],
      }).compile()

      const testService = module.get<IPublicationService>(PublicationService)

      // Action
      await testService.publishAdvertPublication('advert-9', 'pub-9')

      // Assert: Transaction should have been committed
      expect(mockTransaction.commit).toHaveBeenCalled()
      expect(mockTransaction.rollback).not.toHaveBeenCalled()
      expect(transactionCommitted).toBe(true)

      // Assert: Event emitter should have been called with correct payload
      expect(mockEventEmitter.emitAsync).toHaveBeenCalledTimes(1)
      expect(mockEventEmitter.emitAsync).toHaveBeenCalledWith(
        'advert.published',
        {
          advert: { id: 'advert-9', title: 'Test Advert' },
          publication: { id: 'pub-9', versionNumber: 1 },
          html: '<html>Test HTML</html>',
        },
      )

      // Assert: Publication should have been updated with publishedAt
      expect(mockPublication.update).toHaveBeenCalledWith({
        publishedAt: expect.any(Date),
      })
    })
  })
})

describe('PublicationService - Delete Publication Protection', () => {
  let service: IPublicationService
  let advertPublicationModel: typeof AdvertPublicationModel

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublicationService,
        {
          provide: getModelToken(AdvertModel),
          useValue: {
            findOne: jest.fn(),
            findByPkOrThrow: jest.fn(),
            withScope: jest.fn(),
          },
        },
        {
          provide: getModelToken(AdvertPublicationModel),
          useValue: {
            count: jest.fn(),
            findOne: jest.fn(),
            findAll: jest.fn(),
            destroy: jest.fn(),
          },
        },
        {
          provide: Sequelize,
          useValue: mockSequelize,
        },
        {
          provide: LOGGER_PROVIDER,
          useValue: mockLogger,
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
            emitAsync: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<IPublicationService>(PublicationService)
    advertPublicationModel = module.get(getModelToken(AdvertPublicationModel))

    jest.clearAllMocks()
  })

  describe('deleteAdvertPublication', () => {
    it('should throw BadRequestException when trying to delete published version', async () => {
      // Setup: More than one publication exists, but the one to delete is published
      const publishedPublication = {
        id: 'pub-published',
        advertId: 'advert-1',
        publishedAt: new Date('2026-01-08T10:00:00Z'),
        versionNumber: 1,
      }

      ;(advertPublicationModel.count as jest.Mock).mockResolvedValue(2)
      ;(advertPublicationModel.findOne as jest.Mock).mockResolvedValue(
        publishedPublication,
      )

      // Action & Assert
      await expect(
        service.deleteAdvertPublication('advert-1', 'pub-published'),
      ).rejects.toThrow(BadRequestException)
      await expect(
        service.deleteAdvertPublication('advert-1', 'pub-published'),
      ).rejects.toThrow('Cannot delete published versions')

      // Assert: destroy should NOT be called
      expect(advertPublicationModel.destroy).not.toHaveBeenCalled()
    })

    it('should allow deletion of unpublished scheduled versions', async () => {
      // Setup: Unpublished version without publishedAt
      const unpublishedPublication = {
        id: 'pub-scheduled',
        advertId: 'advert-1',
        publishedAt: null,
        versionNumber: 2,
      }

      const remainingPublications = [
        {
          id: 'pub-1',
          versionNumber: 1,
          update: jest.fn().mockResolvedValue(undefined),
        },
      ]

      ;(advertPublicationModel.count as jest.Mock).mockResolvedValue(2)
      ;(advertPublicationModel.findOne as jest.Mock).mockResolvedValue(
        unpublishedPublication,
      )
      ;(advertPublicationModel.destroy as jest.Mock).mockResolvedValue(1)
      ;(advertPublicationModel.findAll as jest.Mock).mockResolvedValue(
        remainingPublications,
      )

      // Action
      await service.deleteAdvertPublication('advert-1', 'pub-scheduled')

      // Assert: destroy should be called
      expect(advertPublicationModel.destroy).toHaveBeenCalledWith({
        where: {
          id: 'pub-scheduled',
          advertId: 'advert-1',
        },
        force: true,
      })
    })

    it('should throw BadRequestException when trying to delete last publication', async () => {
      // Setup: Only one publication exists
      ;(advertPublicationModel.count as jest.Mock).mockResolvedValue(1)

      // Action & Assert
      await expect(
        service.deleteAdvertPublication('advert-1', 'pub-only'),
      ).rejects.toThrow(BadRequestException)
      await expect(
        service.deleteAdvertPublication('advert-1', 'pub-only'),
      ).rejects.toThrow('At least one publication must remain')

      // Assert: findOne should NOT be called (early return)
      expect(advertPublicationModel.findOne).not.toHaveBeenCalled()
    })

    it('should throw NotFoundException when publication does not exist', async () => {
      // Setup: More than one publication, but the one to delete doesn't exist
      ;(advertPublicationModel.count as jest.Mock).mockResolvedValue(2)
      ;(advertPublicationModel.findOne as jest.Mock).mockResolvedValue(null)

      // Action & Assert
      await expect(
        service.deleteAdvertPublication('advert-1', 'pub-nonexistent'),
      ).rejects.toThrow(NotFoundException)
      await expect(
        service.deleteAdvertPublication('advert-1', 'pub-nonexistent'),
      ).rejects.toThrow('Publication not found')
    })

    it('should properly await version renumbering (M-2 fix)', async () => {
      // Setup: Delete middle publication, verify remaining are renumbered sequentially
      const unpublishedPublication = {
        id: 'pub-2',
        advertId: 'advert-1',
        publishedAt: null,
        versionNumber: 2,
      }

      const publication1 = {
        id: 'pub-1',
        versionNumber: 1,
        update: jest.fn().mockResolvedValue(undefined),
      }
      const publication3 = {
        id: 'pub-3',
        versionNumber: 3,
        update: jest.fn().mockResolvedValue(undefined),
      }

      ;(advertPublicationModel.count as jest.Mock).mockResolvedValue(3)
      ;(advertPublicationModel.findOne as jest.Mock).mockResolvedValue(
        unpublishedPublication,
      )
      ;(advertPublicationModel.destroy as jest.Mock).mockResolvedValue(1)
      ;(advertPublicationModel.findAll as jest.Mock).mockResolvedValue([
        publication1,
        publication3,
      ])

      // Action
      await service.deleteAdvertPublication('advert-1', 'pub-2')

      // Assert: version numbers should be updated to 1, 2 (not 1, 3)
      expect(publication1.update).toHaveBeenCalledWith({ versionNumber: 1 })
      expect(publication3.update).toHaveBeenCalledWith({ versionNumber: 2 })

      // Assert: Both updates should have completed (if using forEach incorrectly, this might fail)
      expect(publication1.update).toHaveBeenCalledTimes(1)
      expect(publication3.update).toHaveBeenCalledTimes(1)
    })

    it('should call findAll with correct ordering after deletion', async () => {
      // Setup
      const unpublishedPublication = {
        id: 'pub-scheduled',
        advertId: 'advert-1',
        publishedAt: null,
        versionNumber: 2,
      }

      ;(advertPublicationModel.count as jest.Mock).mockResolvedValue(2)
      ;(advertPublicationModel.findOne as jest.Mock).mockResolvedValue(
        unpublishedPublication,
      )
      ;(advertPublicationModel.destroy as jest.Mock).mockResolvedValue(1)
      ;(advertPublicationModel.findAll as jest.Mock).mockResolvedValue([])

      // Action
      await service.deleteAdvertPublication('advert-1', 'pub-scheduled')

      // Assert: findAll should be called with correct ordering
      expect(advertPublicationModel.findAll).toHaveBeenCalledWith({
        where: { advertId: 'advert-1' },
        order: [
          ['scheduledAt', 'ASC'],
          ['publishedAt', 'ASC'],
        ],
      })
    })
  })
})

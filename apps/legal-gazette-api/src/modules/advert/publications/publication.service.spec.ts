import { Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'

import { BadRequestException } from '@nestjs/common'
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
  })
})

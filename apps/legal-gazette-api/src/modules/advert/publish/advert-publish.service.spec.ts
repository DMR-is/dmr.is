import { Sequelize } from 'sequelize-typescript'

import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager'
import { BadRequestException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { getModelToken } from '@nestjs/sequelize'
import { Test, TestingModule } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { LegalGazetteEvents, SYSTEM_ACTOR } from '../../../core/constants'
import { AdvertModel } from '../../../models/advert.model'
import { AdvertPublicationModel } from '../../../models/advert-publication.model'
import { StatusIdEnum } from '../../../models/status.model'
import { AdvertPublishService } from './advert-publish.service'

const createMockLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
})

const createMockAdvert = (overrides: any = {}) => ({
  id: overrides.id || 'advert-123',
  publicationNumber: overrides.publicationNumber ?? null,
  statusId: overrides.statusId || StatusIdEnum.READY_FOR_PUBLICATION,
  update: jest.fn().mockResolvedValue(undefined),
  reload: jest.fn().mockResolvedValue(undefined),
  htmlMarkup: jest.fn().mockReturnValue('<html>test</html>'),
  fromModelToDetailed: jest.fn().mockReturnValue({
    id: overrides.id || 'advert-123',
    title: 'Test Advert',
  }),
  ...overrides,
})

const createMockPublication = (overrides: any = {}) => ({
  id: overrides.id || 'pub-123',
  advertId: overrides.advertId || 'advert-123',
  publishedAt: overrides.publishedAt ?? null,
  scheduledAt: overrides.scheduledAt || new Date('2026-02-01'),
  versionNumber: overrides.versionNumber || 1,
  versionLetter: overrides.versionLetter || 'A',
  update: jest.fn().mockResolvedValue(undefined),
  reload: jest.fn().mockResolvedValue(undefined),
  fromModel: jest.fn().mockReturnValue({
    id: overrides.id || 'pub-123',
    advertId: overrides.advertId || 'advert-123',
  }),
  ...overrides,
})

const createMockDMRUser = (nationalId = '1234567890') => ({
  nationalId,
  name: 'Test User',
  scope: ['@logbirtingablad.is/logbirtingabladid'],
})

describe('AdvertPublishService', () => {
  let service: AdvertPublishService
  let advertModel: any
  let publicationModel: any
  let sequelize: any
  let eventEmitter: EventEmitter2
  let logger: any

  beforeEach(async () => {
    const mockSequelize = {
      transaction: jest.fn().mockImplementation(async (callback) => {
        const mockTransaction = {
          commit: jest.fn(),
          rollback: jest.fn(),
          afterCommit: jest.fn((cb) => cb()),
        }
        return callback(mockTransaction)
      }),
      literal: jest.fn((sql: string) => ({ val: sql })),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdvertPublishService,
        {
          provide: LOGGER_PROVIDER,
          useValue: createMockLogger(),
        },
        {
          provide: getModelToken(AdvertModel),
          useValue: {
            withScope: jest.fn().mockReturnThis(),
            findByPkOrThrow: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getModelToken(AdvertPublicationModel),
          useValue: {
            findOneOrThrow: jest.fn(),
            findAll: jest.fn(),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
        {
          provide: Sequelize,
          useValue: mockSequelize,
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
            emitAsync: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile()

    service = module.get<AdvertPublishService>(AdvertPublishService)
    advertModel = module.get(getModelToken(AdvertModel))
    publicationModel = module.get(getModelToken(AdvertPublicationModel))
    sequelize = module.get(Sequelize)
    eventEmitter = module.get(EventEmitter2)
    logger = module.get(LOGGER_PROVIDER)

    jest.clearAllMocks()
  })

  describe('publishNextPublication', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should publish the next unpublished publication ordered by scheduledAt', async () => {
      // Arrange
      const advertId = 'advert-123'
      const publication = createMockPublication({
        id: 'pub-next',
        advertId,
        scheduledAt: new Date('2026-02-01'),
        publishedAt: null,
      })
      const advert = createMockAdvert({ id: advertId })

      publicationModel.findOneOrThrow.mockResolvedValue(publication)
      advertModel.withScope.mockReturnThis()
      advertModel.findByPkOrThrow.mockResolvedValue(advert)
      advertModel.findOne.mockResolvedValue(null)
      publicationModel.findAll.mockResolvedValue([publication])

      // Act
      await service.publishNextPublication(advertId)

      // Assert
      expect(publicationModel.findOneOrThrow).toHaveBeenCalledWith(
        {
          limit: 1,
          where: {
            publishedAt: null,
            advertId,
          },
          order: [['scheduledAt', 'ASC']],
        },
        'No unpublished publication found for advert',
      )
      expect(publication.update).toHaveBeenCalledWith({
        publishedAt: expect.any(Date),
      })
    })

    it('should throw error when no unpublished publication found', async () => {
      // Arrange
      const advertId = 'advert-123'
      publicationModel.findOneOrThrow.mockRejectedValue(
        new BadRequestException('No unpublished publication found for advert'),
      )

      // Act & Assert
      await expect(service.publishNextPublication(advertId)).rejects.toThrow(
        'No unpublished publication found for advert',
      )
    })

    it('should pass currentUser to publish method', async () => {
      // Arrange
      const advertId = 'advert-123'
      const currentUser = createMockDMRUser()
      const publication = createMockPublication({ advertId })
      const advert = createMockAdvert({ id: advertId })

      publicationModel.findOneOrThrow.mockResolvedValue(publication)
      advertModel.withScope.mockReturnThis()
      advertModel.findByPkOrThrow.mockResolvedValue(advert)
      advertModel.findOne.mockResolvedValue(null)
      publicationModel.findAll.mockResolvedValue([publication])

      // Act
      await service.publishNextPublication(advertId, currentUser as any)

      // Assert
      expect(eventEmitter.emitAsync).toHaveBeenCalledWith(
        LegalGazetteEvents.STATUS_CHANGED,
        expect.objectContaining({
          actorId: currentUser.nationalId,
        }),
      )
    })
  })

  describe('publishNextPublications', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should publish next publication for multiple adverts', async () => {
      // Arrange
      const advertIds = ['advert-1', 'advert-2']
      const publication1 = createMockPublication({
        id: 'pub-1',
        advertId: 'advert-1',
      })
      const publication2 = createMockPublication({
        id: 'pub-2',
        advertId: 'advert-2',
      })
      const advert1 = createMockAdvert({ id: 'advert-1' })
      const advert2 = createMockAdvert({ id: 'advert-2' })

      publicationModel.findOneOrThrow
        .mockResolvedValueOnce(publication1) // advert-1 publishNextPublication
        .mockResolvedValueOnce(publication1) // advert-1 publish
        .mockResolvedValueOnce(publication2) // advert-2 publishNextPublication
        .mockResolvedValueOnce(publication2) // advert-2 publish
      advertModel.withScope.mockReturnThis()
      advertModel.findByPkOrThrow
        .mockResolvedValueOnce(advert1)
        .mockResolvedValueOnce(advert2)
      advertModel.findOne.mockResolvedValue(null)
      publicationModel.findAll
        .mockResolvedValueOnce([publication1])
        .mockResolvedValueOnce([publication2])

      // Act
      await service.publishNextPublications(advertIds)

      // Assert
      // Each advert calls findOneOrThrow twice: once in publishNextPublication, once in publish
      expect(publicationModel.findOneOrThrow).toHaveBeenCalledTimes(4)
      expect(publication1.update).toHaveBeenCalled()
      expect(publication2.update).toHaveBeenCalled()
    })

    it('should continue publishing even if one advert fails', async () => {
      // Arrange
      const advertIds = ['advert-1', 'advert-2']
      const publication2 = createMockPublication({
        id: 'pub-2',
        advertId: 'advert-2',
      })
      const advert2 = createMockAdvert({ id: 'advert-2' })

      publicationModel.findOneOrThrow
        .mockRejectedValueOnce(new Error('Not found')) // advert-1 fails immediately
        .mockResolvedValueOnce(publication2) // advert-2 publishNextPublication succeeds
        .mockResolvedValueOnce(publication2) // advert-2 publish succeeds
      advertModel.withScope.mockReturnThis()
      advertModel.findByPkOrThrow.mockResolvedValue(advert2)
      advertModel.findOne.mockResolvedValue(null)
      publicationModel.findAll.mockResolvedValue([publication2])

      // Act
      await service.publishNextPublications(advertIds)

      // Assert
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error publishing next publication'),
        expect.objectContaining({
          advertId: 'advert-1',
        }),
      )
      expect(publication2.update).toHaveBeenCalled()
    })
  })

  describe('publish', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should throw BadRequestException if publication already published', async () => {
      // Arrange
      const advertId = 'advert-123'
      const publicationId = 'pub-123'
      const publication = createMockPublication({
        id: publicationId,
        advertId,
        publishedAt: new Date('2026-01-01'),
      })
      const advert = createMockAdvert({ id: advertId })

      advertModel.withScope.mockReturnThis()
      advertModel.findByPkOrThrow.mockResolvedValue(advert)
      publicationModel.findOneOrThrow.mockResolvedValue(publication)

      // Act & Assert
      await expect(service.publishNextPublication(advertId)).rejects.toThrow(
        'Publication already published',
      )
    })

    it('should assign publication number if advert does not have one', async () => {
      // Arrange
      const advertId = 'advert-123'
      const publication = createMockPublication({ advertId })
      const advert = createMockAdvert({
        id: advertId,
        publicationNumber: null,
      })

      publicationModel.findOneOrThrow.mockResolvedValue(publication)
      advertModel.withScope.mockReturnThis()
      advertModel.findByPkOrThrow.mockResolvedValue(advert)
      advertModel.findOne.mockResolvedValue(null) // No existing publications today
      publicationModel.findAll.mockResolvedValue([publication])

      // Act
      await service.publishNextPublication(advertId)

      // Assert
      expect(advert.update).toHaveBeenCalledWith(
        expect.objectContaining({
          publicationNumber: expect.stringMatching(/^\d{11}$/),
          statusId: StatusIdEnum.IN_PUBLISHING,
        }),
      )
    })

    it('should increment publication number based on existing publications', async () => {
      // Arrange
      const advertId = 'advert-123'
      const publication = createMockPublication({ advertId })
      const advert = createMockAdvert({
        id: advertId,
        publicationNumber: null,
      })
      const existingAdvert = {
        id: 'other-advert',
        publicationNumber: '20260202001',
      }

      publicationModel.findOneOrThrow.mockResolvedValue(publication)
      advertModel.withScope.mockReturnThis()
      advertModel.findByPkOrThrow.mockResolvedValue(advert)
      advertModel.findOne.mockResolvedValue(existingAdvert)
      publicationModel.findAll.mockResolvedValue([publication])

      jest.useFakeTimers()
      jest.setSystemTime(new Date('2026-02-02T10:00:00Z'))

      // Act
      await service.publishNextPublication(advertId)

      // Assert
      expect(advert.update).toHaveBeenCalledWith(
        expect.objectContaining({
          publicationNumber: '20260202002',
        }),
      )

      jest.useRealTimers()
    })

    it('should set advert status to PUBLISHED when all publications are published', async () => {
      // Arrange
      const advertId = 'advert-123'
      const publication1 = createMockPublication({
        id: 'pub-1',
        advertId,
        publishedAt: new Date('2026-01-01'),
      })
      const publication2 = createMockPublication({
        id: 'pub-2',
        advertId,
        publishedAt: null,
      })
      const advert = createMockAdvert({
        id: advertId,
        publicationNumber: '20260201001',
      })

      publicationModel.findOneOrThrow.mockResolvedValue(publication2)
      advertModel.withScope.mockReturnThis()
      advertModel.findByPkOrThrow.mockResolvedValue(advert)
      publicationModel.findAll.mockResolvedValue([publication1, publication2])

      // Act
      await service.publishNextPublication(advertId)

      // Assert
      expect(advert.update).toHaveBeenCalledWith(
        { statusId: StatusIdEnum.PUBLISHED },
        expect.any(Object),
      )
    })

    it('should keep status as IN_PUBLISHING when more publications remain', async () => {
      // Arrange
      const advertId = 'advert-123'
      const publication1 = createMockPublication({
        id: 'pub-1',
        advertId,
        publishedAt: null,
      })
      const publication2 = createMockPublication({
        id: 'pub-2',
        advertId,
        publishedAt: null,
      })
      const advert = createMockAdvert({
        id: advertId,
        publicationNumber: null,
      })

      publicationModel.findOneOrThrow.mockResolvedValue(publication1)
      advertModel.withScope.mockReturnThis()
      advertModel.findByPkOrThrow.mockResolvedValue(advert)
      advertModel.findOne.mockResolvedValue(null)
      publicationModel.findAll.mockResolvedValue([publication1, publication2])

      // Act
      await service.publishNextPublication(advertId)

      // Assert
      // Should only update to IN_PUBLISHING, not PUBLISHED
      expect(advert.update).not.toHaveBeenCalledWith(
        { statusId: StatusIdEnum.PUBLISHED },
        expect.any(Object),
      )
      expect(advert.update).toHaveBeenCalledWith(
        expect.objectContaining({
          statusId: StatusIdEnum.IN_PUBLISHING,
        }),
      )
    })

    it('should emit ADVERT_PUBLISHED event', async () => {
      // Arrange
      const advertId = 'advert-123'
      const publication = createMockPublication({ advertId })
      const advert = createMockAdvert({ id: advertId })

      publicationModel.findOneOrThrow.mockResolvedValue(publication)
      advertModel.withScope.mockReturnThis()
      advertModel.findByPkOrThrow.mockResolvedValue(advert)
      advertModel.findOne.mockResolvedValue(null)
      publicationModel.findAll.mockResolvedValue([publication])

      // Act
      await service.publishNextPublication(advertId)

      // Assert
      expect(eventEmitter.emitAsync).toHaveBeenCalledWith(
        LegalGazetteEvents.ADVERT_PUBLISHED,
        expect.objectContaining({
          advert: expect.any(Object),
          publication: expect.any(Object),
          html: expect.any(String),
        }),
      )
    })

    it('should emit STATUS_CHANGED event', async () => {
      // Arrange
      const advertId = 'advert-123'
      const publication = createMockPublication({ advertId })
      const advert = createMockAdvert({ id: advertId })

      publicationModel.findOneOrThrow.mockResolvedValue(publication)
      advertModel.withScope.mockReturnThis()
      advertModel.findByPkOrThrow.mockResolvedValue(advert)
      advertModel.findOne.mockResolvedValue(null)
      publicationModel.findAll.mockResolvedValue([publication])

      // Act
      await service.publishNextPublication(advertId)

      // Assert
      expect(eventEmitter.emitAsync).toHaveBeenCalledWith(
        LegalGazetteEvents.STATUS_CHANGED,
        expect.objectContaining({
          advertId,
          actorId: SYSTEM_ACTOR.id,
          statusId: StatusIdEnum.PUBLISHED,
        }),
      )
    })

    it('should emit CREATE_PUBLISH_COMMENT event', async () => {
      // Arrange
      const advertId = 'advert-123'
      const publication = createMockPublication({ advertId })
      const advert = createMockAdvert({ id: advertId })

      publicationModel.findOneOrThrow.mockResolvedValue(publication)
      advertModel.withScope.mockReturnThis()
      advertModel.findByPkOrThrow.mockResolvedValue(advert)
      advertModel.findOne.mockResolvedValue(null)
      publicationModel.findAll.mockResolvedValue([publication])

      // Act
      await service.publishNextPublication(advertId)

      // Assert
      expect(eventEmitter.emitAsync).toHaveBeenCalledWith(
        LegalGazetteEvents.CREATE_PUBLISH_COMMENT,
        expect.objectContaining({
          advertId,
          actorId: SYSTEM_ACTOR.id,
        }),
      )
    })

    it('should emit ADVERT_PUBLISHED_SIDE_EFFECTS event after transaction', async () => {
      // Arrange
      const advertId = 'advert-123'
      const publication = createMockPublication({ advertId })
      const advert = createMockAdvert({ id: advertId })

      publicationModel.findOneOrThrow.mockResolvedValue(publication)
      advertModel.withScope.mockReturnThis()
      advertModel.findByPkOrThrow.mockResolvedValue(advert)
      advertModel.findOne.mockResolvedValue(null)
      publicationModel.findAll.mockResolvedValue([publication])

      // Act
      await service.publishNextPublication(advertId)

      // Assert
      expect(eventEmitter.emitAsync).toHaveBeenCalledWith(
        LegalGazetteEvents.ADVERT_PUBLISHED_SIDE_EFFECTS,
        expect.objectContaining({
          advert: expect.any(Object),
          publication: expect.any(Object),
          html: expect.any(String),
        }),
      )
    })

    it('should use currentUser nationalId when provided', async () => {
      // Arrange
      const advertId = 'advert-123'
      const currentUser = createMockDMRUser('9876543210')
      const publication = createMockPublication({ advertId })
      const advert = createMockAdvert({ id: advertId })

      publicationModel.findOneOrThrow.mockResolvedValue(publication)
      advertModel.withScope.mockReturnThis()
      advertModel.findByPkOrThrow.mockResolvedValue(advert)
      advertModel.findOne.mockResolvedValue(null)
      publicationModel.findAll.mockResolvedValue([publication])

      // Act
      await service.publishNextPublication(advertId, currentUser as any)

      // Assert
      expect(eventEmitter.emitAsync).toHaveBeenCalledWith(
        LegalGazetteEvents.STATUS_CHANGED,
        expect.objectContaining({
          actorId: '9876543210',
        }),
      )
      expect(eventEmitter.emitAsync).toHaveBeenCalledWith(
        LegalGazetteEvents.CREATE_PUBLISH_COMMENT,
        expect.objectContaining({
          actorId: '9876543210',
        }),
      )
    })

    it('should rollback transaction if event emission fails', async () => {
      // Arrange
      const advertId = 'advert-123'
      const publication = createMockPublication({ advertId })
      const advert = createMockAdvert({ id: advertId })

      publicationModel.findOneOrThrow.mockResolvedValue(publication)
      advertModel.withScope.mockReturnThis()
      advertModel.findByPkOrThrow.mockResolvedValue(advert)
      advertModel.findOne.mockResolvedValue(null)
      publicationModel.findAll.mockResolvedValue([publication])
      eventEmitter.emitAsync = jest
        .fn()
        .mockRejectedValue(new Error('Event emission failed'))

      // Act & Assert
      await expect(service.publishNextPublication(advertId)).rejects.toThrow(
        'Event emission failed',
      )
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error occurred while emitting critical'),
        expect.any(Object),
      )
    })
  })
})

import {
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test, TestingModule } from '@nestjs/testing'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { AdvertModel } from '../../../models/advert.model'
import { AdvertPublicationModel } from '../../../models/advert-publication.model'
import { StatusIdEnum } from '../../../models/status.model'
import { AdvertGuardUtils } from './advert-guard-utils.module'
import { CanPublishGuard } from './can-publish.guard'

describe('CanPublishGuard', () => {
  let guard: CanPublishGuard
  let advertModel: typeof AdvertModel
  let advertPublicationModel: typeof AdvertPublicationModel
  let logger: Logger

  beforeEach(async () => {
    const mockAdvertModel = {
      findOne: jest.fn(),
    }

    const mockAdvertPublicationModel = {
      findOne: jest.fn(),
    }

    const mockLogger = {
      warn: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CanPublishGuard,
        AdvertGuardUtils,
        {
          provide: getModelToken(AdvertModel),
          useValue: mockAdvertModel,
        },
        {
          provide: getModelToken(AdvertPublicationModel),
          useValue: mockAdvertPublicationModel,
        },
        {
          provide: LOGGER_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile()

    guard = module.get<CanPublishGuard>(CanPublishGuard)
    advertModel = module.get(getModelToken(AdvertModel))
    advertPublicationModel = module.get(getModelToken(AdvertPublicationModel))
    logger = module.get(LOGGER_PROVIDER)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  const createMockContext = (
    paramKey: 'advertId' | 'id' | 'publicationId',
    paramValue: string,
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          params: { [paramKey]: paramValue },
        }),
      }),
    } as ExecutionContext
  }

  const createMockAdvert = (statusId: StatusIdEnum): Partial<AdvertModel> => {
    return {
      id: 'advert-123',
      statusId,
      canPublish: jest.fn(() => {
        const allowedStatuses = [
          StatusIdEnum.READY_FOR_PUBLICATION,
          StatusIdEnum.IN_PUBLISHING,
        ]
        return allowedStatuses.includes(statusId)
      }),
    }
  }

  describe('canActivate', () => {
    describe('parameter validation', () => {
      it('should return false when no advertId, id, or publicationId parameter is found', async () => {
        const context = {
          switchToHttp: () => ({
            getRequest: () => ({
              params: {},
            }),
          }),
        } as ExecutionContext

        const result = await guard.canActivate(context)

        expect(result).toBe(false)
        expect(logger.warn).toHaveBeenCalledWith(
          'No advertId, id, or publicationId provided in request',
          { context: 'CanPublishGuard', params: [] },
        )
        expect(advertModel.findOne).not.toHaveBeenCalled()
      })

      it('should use advertId parameter when available', async () => {
        const mockAdvert = createMockAdvert(StatusIdEnum.READY_FOR_PUBLICATION)
        jest
          .spyOn(advertModel, 'findOne')
          .mockResolvedValue(mockAdvert as AdvertModel)

        const context = createMockContext('advertId', 'advert-123')

        await guard.canActivate(context)

        expect(advertModel.findOne).toHaveBeenCalledWith({
          attributes: ['id', 'statusId'],
          where: { id: 'advert-123' },
        })
      })

      it('should use id parameter when advertId is not available', async () => {
        const mockAdvert = createMockAdvert(StatusIdEnum.READY_FOR_PUBLICATION)
        jest
          .spyOn(advertModel, 'findOne')
          .mockResolvedValue(mockAdvert as AdvertModel)

        const context = createMockContext('id', 'advert-456')

        await guard.canActivate(context)

        expect(advertModel.findOne).toHaveBeenCalledWith({
          attributes: ['id', 'statusId'],
          where: { id: 'advert-456' },
        })
      })
    })

    describe('publicationId resolution', () => {
      it('should resolve advertId from publicationId when provided', async () => {
        const mockPublication = {
          advertId: 'resolved-advert-id',
        } as AdvertPublicationModel
        jest
          .spyOn(advertPublicationModel, 'findOne')
          .mockResolvedValue(mockPublication)

        const mockAdvert = createMockAdvert(StatusIdEnum.READY_FOR_PUBLICATION)
        jest
          .spyOn(advertModel, 'findOne')
          .mockResolvedValue(mockAdvert as AdvertModel)

        const context = createMockContext('publicationId', 'publication-123')

        await guard.canActivate(context)

        expect(advertPublicationModel.findOne).toHaveBeenCalledWith({
          attributes: ['advertId'],
          where: { id: 'publication-123' },
        })
        expect(advertModel.findOne).toHaveBeenCalledWith({
          attributes: ['id', 'statusId'],
          where: { id: 'resolved-advert-id' },
        })
      })

      it('should throw NotFoundException when publication does not exist', async () => {
        jest.spyOn(advertPublicationModel, 'findOne').mockResolvedValue(null)

        const context = createMockContext('publicationId', 'non-existent-pub')

        await expect(guard.canActivate(context)).rejects.toThrow(
          NotFoundException,
        )
        await expect(guard.canActivate(context)).rejects.toThrow(
          'Publication with id non-existent-pub not found',
        )
      })

      it('should prioritize advertId over publicationId when both are present', async () => {
        const mockAdvert = createMockAdvert(StatusIdEnum.READY_FOR_PUBLICATION)
        jest
          .spyOn(advertModel, 'findOne')
          .mockResolvedValue(mockAdvert as AdvertModel)

        const context = {
          switchToHttp: () => ({
            getRequest: () => ({
              params: {
                advertId: 'direct-advert-id',
                publicationId: 'publication-123',
              },
            }),
          }),
        } as ExecutionContext

        await guard.canActivate(context)

        // Should use advertId directly, not lookup publication
        expect(advertPublicationModel.findOne).not.toHaveBeenCalled()
        expect(advertModel.findOne).toHaveBeenCalledWith({
          attributes: ['id', 'statusId'],
          where: { id: 'direct-advert-id' },
        })
      })

      it('should prioritize id over publicationId when both are present', async () => {
        const mockAdvert = createMockAdvert(StatusIdEnum.READY_FOR_PUBLICATION)
        jest
          .spyOn(advertModel, 'findOne')
          .mockResolvedValue(mockAdvert as AdvertModel)

        const context = {
          switchToHttp: () => ({
            getRequest: () => ({
              params: { id: 'direct-id', publicationId: 'publication-123' },
            }),
          }),
        } as ExecutionContext

        await guard.canActivate(context)

        // Should use id directly, not lookup publication
        expect(advertPublicationModel.findOne).not.toHaveBeenCalled()
        expect(advertModel.findOne).toHaveBeenCalledWith({
          attributes: ['id', 'statusId'],
          where: { id: 'direct-id' },
        })
      })

      it('should handle database errors during publication lookup', async () => {
        jest
          .spyOn(advertPublicationModel, 'findOne')
          .mockRejectedValue(new Error('Database connection failed'))

        const context = createMockContext('publicationId', 'publication-123')

        await expect(guard.canActivate(context)).rejects.toThrow(
          'Database connection failed',
        )
      })
    })

    describe('advert existence validation', () => {
      it('should throw NotFoundException when advert does not exist', async () => {
        jest.spyOn(advertModel, 'findOne').mockResolvedValue(null)

        const context = createMockContext('advertId', 'non-existent')

        await expect(guard.canActivate(context)).rejects.toThrow(
          NotFoundException,
        )
        await expect(guard.canActivate(context)).rejects.toThrow(
          'Advert not found',
        )
      })
    })

    describe('publish state validation', () => {
      it('should return true when advert is READY_FOR_PUBLICATION', async () => {
        const mockAdvert = createMockAdvert(StatusIdEnum.READY_FOR_PUBLICATION)
        jest
          .spyOn(advertModel, 'findOne')
          .mockResolvedValue(mockAdvert as AdvertModel)

        const context = createMockContext('advertId', 'advert-123')

        const result = await guard.canActivate(context)

        expect(result).toBe(true)
        expect(mockAdvert.canPublish).toHaveBeenCalled()
      })

      it('should return true when advert is IN_PUBLISHING', async () => {
        const mockAdvert = createMockAdvert(StatusIdEnum.IN_PUBLISHING)
        jest
          .spyOn(advertModel, 'findOne')
          .mockResolvedValue(mockAdvert as AdvertModel)

        const context = createMockContext('advertId', 'advert-123')

        const result = await guard.canActivate(context)

        expect(result).toBe(true)
        expect(mockAdvert.canPublish).toHaveBeenCalled()
      })

      it('should throw ForbiddenException when advert is SUBMITTED', async () => {
        const mockAdvert = createMockAdvert(StatusIdEnum.SUBMITTED)
        jest
          .spyOn(advertModel, 'findOne')
          .mockResolvedValue(mockAdvert as AdvertModel)

        const context = createMockContext('advertId', 'advert-123')

        await expect(guard.canActivate(context)).rejects.toThrow(
          ForbiddenException,
        )
        await expect(guard.canActivate(context)).rejects.toThrow(
          'Advert cannot be published in its current state',
        )
        expect(mockAdvert.canPublish).toHaveBeenCalled()
      })

      it('should throw ForbiddenException when advert is IN_PROGRESS', async () => {
        const mockAdvert = createMockAdvert(StatusIdEnum.IN_PROGRESS)
        jest
          .spyOn(advertModel, 'findOne')
          .mockResolvedValue(mockAdvert as AdvertModel)

        const context = createMockContext('advertId', 'advert-123')

        await expect(guard.canActivate(context)).rejects.toThrow(
          ForbiddenException,
        )
        await expect(guard.canActivate(context)).rejects.toThrow(
          'Advert cannot be published in its current state',
        )
      })

      it('should throw ForbiddenException when advert is PUBLISHED', async () => {
        const mockAdvert = createMockAdvert(StatusIdEnum.PUBLISHED)
        jest
          .spyOn(advertModel, 'findOne')
          .mockResolvedValue(mockAdvert as AdvertModel)

        const context = createMockContext('advertId', 'advert-123')

        await expect(guard.canActivate(context)).rejects.toThrow(
          ForbiddenException,
        )
        await expect(guard.canActivate(context)).rejects.toThrow(
          'Advert cannot be published in its current state',
        )
      })

      it('should throw ForbiddenException when advert is REJECTED', async () => {
        const mockAdvert = createMockAdvert(StatusIdEnum.REJECTED)
        jest
          .spyOn(advertModel, 'findOne')
          .mockResolvedValue(mockAdvert as AdvertModel)

        const context = createMockContext('advertId', 'advert-123')

        await expect(guard.canActivate(context)).rejects.toThrow(
          ForbiddenException,
        )
        await expect(guard.canActivate(context)).rejects.toThrow(
          'Advert cannot be published in its current state',
        )
      })

      it('should throw ForbiddenException when advert is WITHDRAWN', async () => {
        const mockAdvert = createMockAdvert(StatusIdEnum.WITHDRAWN)
        jest
          .spyOn(advertModel, 'findOne')
          .mockResolvedValue(mockAdvert as AdvertModel)

        const context = createMockContext('advertId', 'advert-123')

        await expect(guard.canActivate(context)).rejects.toThrow(
          ForbiddenException,
        )
        await expect(guard.canActivate(context)).rejects.toThrow(
          'Advert cannot be published in its current state',
        )
      })
    })

    describe('edge cases', () => {
      it('should handle database errors gracefully', async () => {
        jest
          .spyOn(advertModel, 'findOne')
          .mockRejectedValue(new Error('Database connection failed'))

        const context = createMockContext('advertId', 'advert-123')

        await expect(guard.canActivate(context)).rejects.toThrow(
          'Database connection failed',
        )
      })

      it('should work with both advertId and id parameters in same request', async () => {
        const mockAdvert = createMockAdvert(StatusIdEnum.READY_FOR_PUBLICATION)
        jest
          .spyOn(advertModel, 'findOne')
          .mockResolvedValue(mockAdvert as AdvertModel)

        const context = {
          switchToHttp: () => ({
            getRequest: () => ({
              params: { advertId: 'advert-123', id: 'different-id' },
            }),
          }),
        } as ExecutionContext

        await guard.canActivate(context)

        // Should prioritize advertId
        expect(advertModel.findOne).toHaveBeenCalledWith({
          attributes: ['id', 'statusId'],
          where: { id: 'advert-123' },
        })
      })
    })
  })
})

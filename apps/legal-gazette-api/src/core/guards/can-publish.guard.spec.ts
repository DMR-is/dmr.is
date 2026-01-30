import { ExecutionContext, NotFoundException } from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test, TestingModule } from '@nestjs/testing'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { AdvertModel } from '../../models/advert.model'
import { StatusIdEnum } from '../../models/status.model'
import { CanPublishGuard } from './can-publish.guard'

describe('CanPublishGuard', () => {
  let guard: CanPublishGuard
  let advertModel: typeof AdvertModel
  let logger: Logger

  beforeEach(async () => {
    const mockAdvertModel = {
      findOne: jest.fn(),
    }

    const mockLogger = {
      warn: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CanPublishGuard,
        {
          provide: getModelToken(AdvertModel),
          useValue: mockAdvertModel,
        },
        {
          provide: LOGGER_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile()

    guard = module.get<CanPublishGuard>(CanPublishGuard)
    advertModel = module.get(getModelToken(AdvertModel))
    logger = module.get(LOGGER_PROVIDER)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  const createMockContext = (
    paramKey: 'advertId' | 'id',
    advertId: string,
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          params: { [paramKey]: advertId },
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
      it('should return false when no advertId or id parameter is found', async () => {
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
          'No advertId or id found in request parameters',
          { context: 'CanPublishGuard' },
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

    describe('advert existence validation', () => {
      it('should throw NotFoundException when advert does not exist', async () => {
        jest.spyOn(advertModel, 'findOne').mockResolvedValue(null)

        const context = createMockContext('advertId', 'non-existent')

        await expect(guard.canActivate(context)).rejects.toThrow(
          NotFoundException,
        )
        await expect(guard.canActivate(context)).rejects.toThrow(
          'Advert with id non-existent not found',
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

      it('should return false when advert is SUBMITTED', async () => {
        const mockAdvert = createMockAdvert(StatusIdEnum.SUBMITTED)
        jest
          .spyOn(advertModel, 'findOne')
          .mockResolvedValue(mockAdvert as AdvertModel)

        const context = createMockContext('advertId', 'advert-123')

        const result = await guard.canActivate(context)

        expect(result).toBe(false)
        expect(mockAdvert.canPublish).toHaveBeenCalled()
        expect(logger.warn).toHaveBeenCalledWith(
          'Advert with id advert-123 is not in a publishable state',
          { context: 'CanPublishGuard' },
        )
      })

      it('should return false when advert is IN_PROGRESS', async () => {
        const mockAdvert = createMockAdvert(StatusIdEnum.IN_PROGRESS)
        jest
          .spyOn(advertModel, 'findOne')
          .mockResolvedValue(mockAdvert as AdvertModel)

        const context = createMockContext('advertId', 'advert-123')

        const result = await guard.canActivate(context)

        expect(result).toBe(false)
        expect(logger.warn).toHaveBeenCalledWith(
          'Advert with id advert-123 is not in a publishable state',
          { context: 'CanPublishGuard' },
        )
      })

      it('should return false when advert is PUBLISHED', async () => {
        const mockAdvert = createMockAdvert(StatusIdEnum.PUBLISHED)
        jest
          .spyOn(advertModel, 'findOne')
          .mockResolvedValue(mockAdvert as AdvertModel)

        const context = createMockContext('advertId', 'advert-123')

        const result = await guard.canActivate(context)

        expect(result).toBe(false)
      })

      it('should return false when advert is REJECTED', async () => {
        const mockAdvert = createMockAdvert(StatusIdEnum.REJECTED)
        jest
          .spyOn(advertModel, 'findOne')
          .mockResolvedValue(mockAdvert as AdvertModel)

        const context = createMockContext('advertId', 'advert-123')

        const result = await guard.canActivate(context)

        expect(result).toBe(false)
      })

      it('should return false when advert is WITHDRAWN', async () => {
        const mockAdvert = createMockAdvert(StatusIdEnum.WITHDRAWN)
        jest
          .spyOn(advertModel, 'findOne')
          .mockResolvedValue(mockAdvert as AdvertModel)

        const context = createMockContext('advertId', 'advert-123')

        const result = await guard.canActivate(context)

        expect(result).toBe(false)
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

import {
  BadRequestException,
  ExecutionContext,
  NotFoundException,
} from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test, TestingModule } from '@nestjs/testing'

import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { AdvertModel } from '../../../models/advert.model'
import { StatusIdEnum } from '../../../models/status.model'
import { CanPublishBulkGuard } from './can-publish-bulk.guard'
describe('CanPublishBulkGuard', () => {
  let guard: CanPublishBulkGuard
  let advertModel: typeof AdvertModel
  let logger: Logger
  beforeEach(async () => {
    const mockAdvertModel = {
      findAll: jest.fn(),
    }
    const mockLogger = {
      warn: jest.fn(),
      info: jest.fn(),
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CanPublishBulkGuard,
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
    guard = module.get<CanPublishBulkGuard>(CanPublishBulkGuard)
    advertModel = module.get(getModelToken(AdvertModel))
    logger = module.get(LOGGER_PROVIDER)
  })
  afterEach(() => {
    jest.clearAllMocks()
  })
  const createMockContext = (advertIds: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          body: { advertIds },
        }),
      }),
    } as ExecutionContext
  }
  const createMockAdvert = (
    id: string,
    statusId: StatusIdEnum,
  ): Partial<AdvertModel> => {
    return {
      id,
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
    describe('request body validation', () => {
      it('should throw BadRequestException when advertIds is missing', async () => {
        const context = {
          switchToHttp: () => ({
            getRequest: () => ({
              body: {},
            }),
          }),
        } as ExecutionContext
        await expect(guard.canActivate(context)).rejects.toThrow(
          BadRequestException,
        )
        await expect(guard.canActivate(context)).rejects.toThrow(
          'Request body must contain an advertIds array',
        )
        expect(logger.warn).toHaveBeenCalledWith(
          'No advertIds array found in request body',
          { context: 'CanPublishBulkGuard' },
        )
      })
      it('should throw BadRequestException when advertIds is not an array', async () => {
        const context = createMockContext('not-an-array')
        await expect(guard.canActivate(context)).rejects.toThrow(
          BadRequestException,
        )
        await expect(guard.canActivate(context)).rejects.toThrow(
          'Request body must contain an advertIds array',
        )
      })
      it('should throw BadRequestException when advertIds is an empty array', async () => {
        const context = createMockContext([])
        await expect(guard.canActivate(context)).rejects.toThrow(
          BadRequestException,
        )
        await expect(guard.canActivate(context)).rejects.toThrow(
          'advertIds array cannot be empty',
        )
        expect(logger.warn).toHaveBeenCalledWith(
          'Empty advertIds array provided',
          { context: 'CanPublishBulkGuard' },
        )
      })
      it('should throw BadRequestException when advertIds is null', async () => {
        const context = createMockContext(null)
        await expect(guard.canActivate(context)).rejects.toThrow(
          BadRequestException,
        )
      })
      it('should throw BadRequestException when body is undefined', async () => {
        const context = {
          switchToHttp: () => ({
            getRequest: () => ({
              body: undefined,
            }),
          }),
        } as ExecutionContext
        await expect(guard.canActivate(context)).rejects.toThrow(
          BadRequestException,
        )
      })
    })
    describe('advert existence validation', () => {
      it('should throw NotFoundException when some adverts do not exist', async () => {
        const advertIds = ['advert-1', 'advert-2', 'advert-3']
        const mockAdverts = [
          createMockAdvert('advert-1', StatusIdEnum.READY_FOR_PUBLICATION),
          createMockAdvert('advert-3', StatusIdEnum.READY_FOR_PUBLICATION),
        ]
        jest
          .spyOn(advertModel, 'findAll')
          .mockResolvedValue(mockAdverts as AdvertModel[])
        const context = createMockContext(advertIds)
        await expect(guard.canActivate(context)).rejects.toThrow(
          NotFoundException,
        )
        await expect(guard.canActivate(context)).rejects.toThrow(
          'Adverts not found: advert-2',
        )
        expect(logger.warn).toHaveBeenCalledWith('Some adverts not found', {
          context: 'CanPublishBulkGuard',
          missingIds: ['advert-2'],
        })
      })
      it('should throw NotFoundException when all adverts do not exist', async () => {
        const advertIds = ['advert-1', 'advert-2']
        jest.spyOn(advertModel, 'findAll').mockResolvedValue([])
        const context = createMockContext(advertIds)
        await expect(guard.canActivate(context)).rejects.toThrow(
          NotFoundException,
        )
        await expect(guard.canActivate(context)).rejects.toThrow(
          'Adverts not found: advert-1, advert-2',
        )
      })
      it('should throw NotFoundException when multiple adverts are missing', async () => {
        const advertIds = ['advert-1', 'advert-2', 'advert-3', 'advert-4']
        const mockAdverts = [
          createMockAdvert('advert-2', StatusIdEnum.READY_FOR_PUBLICATION),
          createMockAdvert('advert-4', StatusIdEnum.READY_FOR_PUBLICATION),
        ]
        jest
          .spyOn(advertModel, 'findAll')
          .mockResolvedValue(mockAdverts as AdvertModel[])
        const context = createMockContext(advertIds)
        await expect(guard.canActivate(context)).rejects.toThrow(
          'Adverts not found: advert-1, advert-3',
        )
      })
    })
    describe('publish state validation', () => {
      it('should return true when all adverts are READY_FOR_PUBLICATION', async () => {
        const advertIds = ['advert-1', 'advert-2', 'advert-3']
        const mockAdverts = advertIds.map((id) =>
          createMockAdvert(id, StatusIdEnum.READY_FOR_PUBLICATION),
        )
        jest
          .spyOn(advertModel, 'findAll')
          .mockResolvedValue(mockAdverts as AdvertModel[])
        const context = createMockContext(advertIds)
        const result = await guard.canActivate(context)
        expect(result).toBe(true)
        expect(advertModel.findAll).toHaveBeenCalledWith({
          attributes: ['id', 'statusId'],
          where: { id: advertIds },
        })
        expect(logger.info).toHaveBeenCalledWith(
          'All 3 adverts are in a publishable state',
          { context: 'CanPublishBulkGuard', count: 3 },
        )
      })
      it('should return true when all adverts are IN_PUBLISHING', async () => {
        const advertIds = ['advert-1', 'advert-2']
        const mockAdverts = advertIds.map((id) =>
          createMockAdvert(id, StatusIdEnum.IN_PUBLISHING),
        )
        jest
          .spyOn(advertModel, 'findAll')
          .mockResolvedValue(mockAdverts as AdvertModel[])
        const context = createMockContext(advertIds)
        const result = await guard.canActivate(context)
        expect(result).toBe(true)
        expect(logger.info).toHaveBeenCalledWith(
          'All 2 adverts are in a publishable state',
          { context: 'CanPublishBulkGuard', count: 2 },
        )
      })
      it('should return true when adverts are mix of READY_FOR_PUBLICATION and IN_PUBLISHING', async () => {
        const advertIds = ['advert-1', 'advert-2', 'advert-3']
        const mockAdverts = [
          createMockAdvert('advert-1', StatusIdEnum.READY_FOR_PUBLICATION),
          createMockAdvert('advert-2', StatusIdEnum.IN_PUBLISHING),
          createMockAdvert('advert-3', StatusIdEnum.READY_FOR_PUBLICATION),
        ]
        jest
          .spyOn(advertModel, 'findAll')
          .mockResolvedValue(mockAdverts as AdvertModel[])
        const context = createMockContext(advertIds)
        const result = await guard.canActivate(context)
        expect(result).toBe(true)
      })
      it('should return true for a single publishable advert', async () => {
        const advertIds = ['advert-1']
        const mockAdverts = [
          createMockAdvert('advert-1', StatusIdEnum.READY_FOR_PUBLICATION),
        ]
        jest
          .spyOn(advertModel, 'findAll')
          .mockResolvedValue(mockAdverts as AdvertModel[])
        const context = createMockContext(advertIds)
        const result = await guard.canActivate(context)
        expect(result).toBe(true)
      })
      it('should throw BadRequestException when one advert is not publishable', async () => {
        const advertIds = ['advert-1', 'advert-2', 'advert-3']
        const mockAdverts = [
          createMockAdvert('advert-1', StatusIdEnum.READY_FOR_PUBLICATION),
          createMockAdvert('advert-2', StatusIdEnum.SUBMITTED),
          createMockAdvert('advert-3', StatusIdEnum.READY_FOR_PUBLICATION),
        ]
        jest
          .spyOn(advertModel, 'findAll')
          .mockResolvedValue(mockAdverts as AdvertModel[])
        const context = createMockContext(advertIds)
        await expect(guard.canActivate(context)).rejects.toThrow(
          BadRequestException,
        )
        await expect(guard.canActivate(context)).rejects.toThrow(
          'The following adverts are not in a publishable state: advert-2',
        )
        expect(logger.warn).toHaveBeenCalledWith(
          'Some adverts are not in a publishable state',
          {
            context: 'CanPublishBulkGuard',
            unpublishableIds: ['advert-2'],
            statuses: [{ id: 'advert-2', status: StatusIdEnum.SUBMITTED }],
          },
        )
      })
      it('should throw BadRequestException when multiple adverts are not publishable', async () => {
        const advertIds = ['advert-1', 'advert-2', 'advert-3', 'advert-4']
        const mockAdverts = [
          createMockAdvert('advert-1', StatusIdEnum.READY_FOR_PUBLICATION),
          createMockAdvert('advert-2', StatusIdEnum.PUBLISHED),
          createMockAdvert('advert-3', StatusIdEnum.IN_PROGRESS),
          createMockAdvert('advert-4', StatusIdEnum.READY_FOR_PUBLICATION),
        ]
        jest
          .spyOn(advertModel, 'findAll')
          .mockResolvedValue(mockAdverts as AdvertModel[])
        const context = createMockContext(advertIds)
        await expect(guard.canActivate(context)).rejects.toThrow(
          'The following adverts are not in a publishable state: advert-2, advert-3',
        )
      })
      it('should throw BadRequestException when all adverts are not publishable', async () => {
        const advertIds = ['advert-1', 'advert-2']
        const mockAdverts = [
          createMockAdvert('advert-1', StatusIdEnum.SUBMITTED),
          createMockAdvert('advert-2', StatusIdEnum.REJECTED),
        ]
        jest
          .spyOn(advertModel, 'findAll')
          .mockResolvedValue(mockAdverts as AdvertModel[])
        const context = createMockContext(advertIds)
        await expect(guard.canActivate(context)).rejects.toThrow(
          BadRequestException,
        )
        await expect(guard.canActivate(context)).rejects.toThrow(
          'The following adverts are not in a publishable state: advert-1, advert-2',
        )
      })
      it('should throw BadRequestException for WITHDRAWN status', async () => {
        const advertIds = ['advert-1']
        const mockAdverts = [
          createMockAdvert('advert-1', StatusIdEnum.WITHDRAWN),
        ]
        jest
          .spyOn(advertModel, 'findAll')
          .mockResolvedValue(mockAdverts as AdvertModel[])
        const context = createMockContext(advertIds)
        await expect(guard.canActivate(context)).rejects.toThrow(
          BadRequestException,
        )
      })
    })
    describe('edge cases', () => {
      it('should handle database errors gracefully', async () => {
        const advertIds = ['advert-1', 'advert-2']
        jest
          .spyOn(advertModel, 'findAll')
          .mockRejectedValue(new Error('Database connection failed'))
        const context = createMockContext(advertIds)
        await expect(guard.canActivate(context)).rejects.toThrow(
          'Database connection failed',
        )
      })
      it('should handle large number of adverts', async () => {
        const advertIds = Array.from({ length: 100 }, (_, i) => `advert-${i}`)
        const mockAdverts = advertIds.map((id) =>
          createMockAdvert(id, StatusIdEnum.READY_FOR_PUBLICATION),
        )
        jest
          .spyOn(advertModel, 'findAll')
          .mockResolvedValue(mockAdverts as AdvertModel[])
        const context = createMockContext(advertIds)
        const result = await guard.canActivate(context)
        expect(result).toBe(true)
        expect(logger.info).toHaveBeenCalledWith(
          'All 100 adverts are in a publishable state',
          { context: 'CanPublishBulkGuard', count: 100 },
        )
      })
      it('should handle duplicate IDs in the request', async () => {
        const advertIds = ['advert-1', 'advert-1', 'advert-2']
        const mockAdverts = [
          createMockAdvert('advert-1', StatusIdEnum.READY_FOR_PUBLICATION),
          createMockAdvert('advert-2', StatusIdEnum.READY_FOR_PUBLICATION),
        ]
        jest
          .spyOn(advertModel, 'findAll')
          .mockResolvedValue(mockAdverts as AdvertModel[])
        const context = createMockContext(advertIds)
        // Should fail because it expects 3 adverts but only finds 2
        await expect(guard.canActivate(context)).rejects.toThrow(
          NotFoundException,
        )
      })
    })
  })
})

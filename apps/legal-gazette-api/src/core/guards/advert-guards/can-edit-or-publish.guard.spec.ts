import {
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test, TestingModule } from '@nestjs/testing'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { AdvertModel } from '../../../models/advert.model'
import { AdvertPublicationModel } from '../../../models/advert-publication.model'
import { StatusIdEnum } from '../../../models/status.model'
import { CanEditOrPublishGuard } from './can-edit-or-publish.guard'

describe('CanEditOrPublishGuard', () => {
  let guard: CanEditOrPublishGuard
  let advertModel: typeof AdvertModel
  let advertPublicationModel: typeof AdvertPublicationModel
  let logger: Logger

  const ADMIN_ID = 'admin-123'
  const DIFFERENT_ADMIN_ID = 'admin-456'

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
        CanEditOrPublishGuard,
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

    guard = module.get<CanEditOrPublishGuard>(CanEditOrPublishGuard)
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
    user?: DMRUser,
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          params: { [paramKey]: paramValue },
          user,
        }),
      }),
    } as ExecutionContext
  }

  const createMockAdvert = (
    statusId: StatusIdEnum,
    assignedAdminId?: string,
  ): Partial<AdvertModel> => {
    return {
      id: 'advert-123',
      statusId,
      canEdit: jest.fn((adminId: string) => {
        return assignedAdminId === adminId
      }),
      canPublish: jest.fn(() => {
        const allowedStatuses = [
          StatusIdEnum.READY_FOR_PUBLICATION,
          StatusIdEnum.IN_PUBLISHING,
        ]
        return allowedStatuses.includes(statusId)
      }),
    }
  }

  const createMockUser = (adminUserId: string): DMRUser => ({
    nationalId: '1234567890',
    name: 'Test User',
    fullName: 'Test User Full Name',
    scope: [],
    client: 'test-client',
    authorization: 'test-auth',
    adminUserId,
  })

  describe('canActivate', () => {
    describe('parameter validation', () => {
      it('should return false when no advertId, id, or publicationId parameter is found', async () => {
        const context = {
          switchToHttp: () => ({
            getRequest: () => ({
              params: {},
              user: createMockUser(ADMIN_ID),
            }),
          }),
        } as ExecutionContext

        const result = await guard.canActivate(context)

        expect(result).toBe(false)
        expect(logger.warn).toHaveBeenCalledWith(
          'No advertId, id, or publicationId provided in request',
          { context: 'CanEditOrPublishGuard', params: [] },
        )
        expect(advertModel.findOne).not.toHaveBeenCalled()
      })
    })

    describe('publicationId resolution', () => {
      it('should resolve advertId from publicationId', async () => {
        const mockPublication = {
          advertId: 'resolved-advert-id',
        } as AdvertPublicationModel
        jest
          .spyOn(advertPublicationModel, 'findOne')
          .mockResolvedValue(mockPublication)

        const mockAdvert = createMockAdvert(
          StatusIdEnum.READY_FOR_PUBLICATION,
          ADMIN_ID,
        )
        jest
          .spyOn(advertModel, 'findOne')
          .mockResolvedValue(mockAdvert as AdvertModel)

        const context = createMockContext(
          'publicationId',
          'publication-123',
          createMockUser(ADMIN_ID),
        )

        await guard.canActivate(context)

        expect(advertPublicationModel.findOne).toHaveBeenCalledWith({
          attributes: ['advertId'],
          where: { id: 'publication-123' },
        })
        expect(advertModel.findOne).toHaveBeenCalledWith({
          attributes: ['id', 'statusId', 'assignedUserId'],
          where: { id: 'resolved-advert-id' },
        })
      })

      it('should throw NotFoundException when publication does not exist', async () => {
        jest.spyOn(advertPublicationModel, 'findOne').mockResolvedValue(null)

        const context = createMockContext(
          'publicationId',
          'non-existent-pub',
          createMockUser(ADMIN_ID),
        )

        await expect(guard.canActivate(context)).rejects.toThrow(
          NotFoundException,
        )
        await expect(guard.canActivate(context)).rejects.toThrow(
          'Publication with id non-existent-pub not found',
        )
      })
    })

    describe('advert existence validation', () => {
      it('should throw NotFoundException when advert does not exist', async () => {
        jest.spyOn(advertModel, 'findOne').mockResolvedValue(null)

        const context = createMockContext(
          'advertId',
          'non-existent',
          createMockUser(ADMIN_ID),
        )

        await expect(guard.canActivate(context)).rejects.toThrow(
          NotFoundException,
        )
        await expect(guard.canActivate(context)).rejects.toThrow(
          'Advert with id non-existent not found',
        )
      })
    })

    describe('OR logic - canEdit OR canPublish', () => {
      it('should ALLOW when user can edit (assigned) even if not publishable', async () => {
        const mockAdvert = createMockAdvert(StatusIdEnum.IN_PROGRESS, ADMIN_ID)
        jest
          .spyOn(advertModel, 'findOne')
          .mockResolvedValue(mockAdvert as AdvertModel)

        const context = createMockContext(
          'advertId',
          'advert-123',
          createMockUser(ADMIN_ID),
        )

        const result = await guard.canActivate(context)

        expect(result).toBe(true)
        expect(mockAdvert.canEdit).toHaveBeenCalledWith(ADMIN_ID)
        expect(mockAdvert.canPublish).toHaveBeenCalled()
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining('Access granted'),
          expect.objectContaining({
            canEdit: true,
            canPublish: false,
          }),
        )
      })

      it('should ALLOW when advert is publishable even if user not assigned', async () => {
        const mockAdvert = createMockAdvert(
          StatusIdEnum.READY_FOR_PUBLICATION,
          DIFFERENT_ADMIN_ID, // Different admin is assigned
        )
        jest
          .spyOn(advertModel, 'findOne')
          .mockResolvedValue(mockAdvert as AdvertModel)

        const context = createMockContext(
          'advertId',
          'advert-123',
          createMockUser(ADMIN_ID),
        )

        const result = await guard.canActivate(context)

        expect(result).toBe(true)
        expect(mockAdvert.canEdit).toHaveBeenCalledWith(ADMIN_ID)
        expect(mockAdvert.canPublish).toHaveBeenCalled()
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining('Access granted'),
          expect.objectContaining({
            canEdit: false,
            canPublish: true,
          }),
        )
      })

      it('should ALLOW when user can edit AND advert is publishable', async () => {
        const mockAdvert = createMockAdvert(
          StatusIdEnum.READY_FOR_PUBLICATION,
          ADMIN_ID,
        )
        jest
          .spyOn(advertModel, 'findOne')
          .mockResolvedValue(mockAdvert as AdvertModel)

        const context = createMockContext(
          'advertId',
          'advert-123',
          createMockUser(ADMIN_ID),
        )

        const result = await guard.canActivate(context)

        expect(result).toBe(true)
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining('Access granted'),
          expect.objectContaining({
            canEdit: true,
            canPublish: true,
          }),
        )
      })

      it('should DENY when user cannot edit AND advert is not publishable', async () => {
        const mockAdvert = createMockAdvert(
          StatusIdEnum.IN_PROGRESS,
          DIFFERENT_ADMIN_ID, // Different admin is assigned
        )
        jest
          .spyOn(advertModel, 'findOne')
          .mockResolvedValue(mockAdvert as AdvertModel)

        const context = createMockContext(
          'advertId',
          'advert-123',
          createMockUser(ADMIN_ID),
        )

        await expect(guard.canActivate(context)).rejects.toThrow(
          ForbiddenException,
        )
        await expect(guard.canActivate(context)).rejects.toThrow(
          'Cannot perform this operation. User must be assigned to the advert or advert must be in publishable state',
        )
      })

      it('should DENY when no user provided (unauthenticated) and advert not publishable', async () => {
        const mockAdvert = createMockAdvert(StatusIdEnum.SUBMITTED)
        jest
          .spyOn(advertModel, 'findOne')
          .mockResolvedValue(mockAdvert as AdvertModel)

        const context = createMockContext('advertId', 'advert-123', undefined)

        await expect(guard.canActivate(context)).rejects.toThrow(
          ForbiddenException,
        )
      })

      it('should ALLOW when no user provided but advert is publishable', async () => {
        const mockAdvert = createMockAdvert(StatusIdEnum.READY_FOR_PUBLICATION)
        jest
          .spyOn(advertModel, 'findOne')
          .mockResolvedValue(mockAdvert as AdvertModel)

        const context = createMockContext('advertId', 'advert-123', undefined)

        const result = await guard.canActivate(context)

        expect(result).toBe(true)
      })
    })

    describe('status-specific scenarios', () => {
      it('should allow IN_PUBLISHING status through publish check', async () => {
        const mockAdvert = createMockAdvert(
          StatusIdEnum.IN_PUBLISHING,
          DIFFERENT_ADMIN_ID,
        )
        jest
          .spyOn(advertModel, 'findOne')
          .mockResolvedValue(mockAdvert as AdvertModel)

        const context = createMockContext(
          'advertId',
          'advert-123',
          createMockUser(ADMIN_ID),
        )

        const result = await guard.canActivate(context)

        expect(result).toBe(true)
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining('Access granted'),
          expect.objectContaining({
            canEdit: false,
            canPublish: true,
          }),
        )
      })

      it('should deny PUBLISHED status unless user is assigned', async () => {
        const mockAdvert = createMockAdvert(
          StatusIdEnum.PUBLISHED,
          DIFFERENT_ADMIN_ID,
        )
        jest
          .spyOn(advertModel, 'findOne')
          .mockResolvedValue(mockAdvert as AdvertModel)

        const context = createMockContext(
          'advertId',
          'advert-123',
          createMockUser(ADMIN_ID),
        )

        await expect(guard.canActivate(context)).rejects.toThrow(
          ForbiddenException,
        )
      })

      it('should allow PUBLISHED status if user is assigned', async () => {
        const mockAdvert = createMockAdvert(StatusIdEnum.PUBLISHED, ADMIN_ID)
        jest
          .spyOn(advertModel, 'findOne')
          .mockResolvedValue(mockAdvert as AdvertModel)

        const context = createMockContext(
          'advertId',
          'advert-123',
          createMockUser(ADMIN_ID),
        )

        const result = await guard.canActivate(context)

        expect(result).toBe(true)
      })
    })

    describe('edge cases', () => {
      it('should handle database errors gracefully', async () => {
        jest
          .spyOn(advertModel, 'findOne')
          .mockRejectedValue(new Error('Database connection failed'))

        const context = createMockContext(
          'advertId',
          'advert-123',
          createMockUser(ADMIN_ID),
        )

        await expect(guard.canActivate(context)).rejects.toThrow(
          'Database connection failed',
        )
      })

      it('should prioritize advertId over id parameter', async () => {
        const mockAdvert = createMockAdvert(
          StatusIdEnum.READY_FOR_PUBLICATION,
          ADMIN_ID,
        )
        jest
          .spyOn(advertModel, 'findOne')
          .mockResolvedValue(mockAdvert as AdvertModel)

        const context = {
          switchToHttp: () => ({
            getRequest: () => ({
              params: {
                advertId: 'advert-123',
                id: 'different-id',
              },
              user: createMockUser(ADMIN_ID),
            }),
          }),
        } as ExecutionContext

        await guard.canActivate(context)

        expect(advertModel.findOne).toHaveBeenCalledWith({
          attributes: ['id', 'statusId', 'assignedUserId'],
          where: { id: 'advert-123' },
        })
      })

      it('should prioritize advertId over publicationId', async () => {
        const mockAdvert = createMockAdvert(
          StatusIdEnum.READY_FOR_PUBLICATION,
          ADMIN_ID,
        )
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
              user: createMockUser(ADMIN_ID),
            }),
          }),
        } as ExecutionContext

        await guard.canActivate(context)

        expect(advertPublicationModel.findOne).not.toHaveBeenCalled()
        expect(advertModel.findOne).toHaveBeenCalledWith({
          attributes: ['id', 'statusId', 'assignedUserId'],
          where: { id: 'direct-advert-id' },
        })
      })
    })
  })
})

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
import { CanEditGuard } from './can-edit.guard'

describe('CanEditGuard', () => {
  let guard: CanEditGuard
  let advertModel: typeof AdvertModel
  let advertPublicationModel: typeof AdvertPublicationModel
  let logger: Logger

  const adminUser: DMRUser = {
    adminUserId: 'admin-123',
    nationalId: '1234567890',
    name: 'Admin User',
    fullName: 'Admin User',
    scope: [],
    actor: undefined,
    client: '',
    authorization: '',
  }

  const nonAdminUser: DMRUser = {
    nationalId: '0987654321',
    name: 'Non-Admin User',
    fullName: 'Non-Admin User',
    scope: [],
    actor: undefined,
    client: '',
    authorization: '',
  }

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
        CanEditGuard,
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

    guard = module.get<CanEditGuard>(CanEditGuard)
    advertModel = module.get(getModelToken(AdvertModel))
    advertPublicationModel = module.get(getModelToken(AdvertPublicationModel))
    logger = module.get(LOGGER_PROVIDER)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  const createMockContext = (
    user: DMRUser | null,
    params: Record<string, string>,
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          params,
        }),
      }),
    } as ExecutionContext
  }

  const createMockAdvert = (
    statusId: StatusIdEnum,
    assignedUserId: string,
  ): Partial<AdvertModel> => {
    return {
      id: 'advert-123',
      statusId,
      assignedUserId,
      canEdit: jest.fn((userId?: string) => {
        const editableStateIds = [
          StatusIdEnum.IN_PROGRESS,
          StatusIdEnum.READY_FOR_PUBLICATION,
          StatusIdEnum.SUBMITTED,
        ]
        return editableStateIds.includes(statusId) && assignedUserId === userId
      }),
    }
  }

  describe('canActivate', () => {
    describe('admin validation', () => {
      it('should return false when user does not have admin privileges', async () => {
        const context = createMockContext(nonAdminUser, {
          advertId: 'advert-123',
        })

        const result = await guard.canActivate(context)

        expect(result).toBe(false)
        expect(logger.warn).toHaveBeenCalledWith(
          'Admin user id not found on authenticated user',
          { context: 'CanEditGuard' },
        )
        expect(advertModel.findOne).not.toHaveBeenCalled()
      })

      it('should return false when user is null', async () => {
        const context = createMockContext(null, { advertId: 'advert-123' })

        const result = await guard.canActivate(context)

        expect(result).toBe(false)
        expect(logger.warn).toHaveBeenCalledWith(
          'Admin user id not found on authenticated user',
          { context: 'CanEditGuard' },
        )
      })
    })

    describe('parameter resolution - direct advertId', () => {
      it('should use advertId parameter when available', async () => {
        const mockAdvert = createMockAdvert(
          StatusIdEnum.IN_PROGRESS,
          'admin-123',
        )
        jest
          .spyOn(advertModel, 'findOne')
          .mockResolvedValue(mockAdvert as AdvertModel)

        const context = createMockContext(adminUser, {
          advertId: 'advert-123',
        })

        await guard.canActivate(context)

        expect(advertModel.findOne).toHaveBeenCalledWith({
          attributes: ['id', 'statusId', 'assignedUserId'],
          where: { id: 'advert-123' },
        })
        expect(advertPublicationModel.findOne).not.toHaveBeenCalled()
      })

      it('should use id parameter when advertId is not available', async () => {
        const mockAdvert = createMockAdvert(
          StatusIdEnum.IN_PROGRESS,
          'admin-123',
        )
        jest
          .spyOn(advertModel, 'findOne')
          .mockResolvedValue(mockAdvert as AdvertModel)

        const context = createMockContext(adminUser, { id: 'advert-456' })

        await guard.canActivate(context)

        expect(advertModel.findOne).toHaveBeenCalledWith({
          attributes: ['id', 'statusId', 'assignedUserId'],
          where: { id: 'advert-456' },
        })
        expect(advertPublicationModel.findOne).not.toHaveBeenCalled()
      })

      it('should return false when no parameters are found', async () => {
        const context = createMockContext(adminUser, {})

        const result = await guard.canActivate(context)

        expect(result).toBe(false)
        expect(logger.warn).toHaveBeenCalledWith(
          'No advertId, id, or publicationId found in request parameters',
          {
            context: 'CanEditGuard',
            params: [],
          },
        )
        expect(advertModel.findOne).not.toHaveBeenCalled()
      })
    })

    describe('parameter resolution - nested publicationId', () => {
      it('should resolve advertId from publicationId', async () => {
        const mockPublication = { advertId: 'advert-789' }
        jest
          .spyOn(advertPublicationModel, 'findOne')
          .mockResolvedValue(mockPublication as AdvertPublicationModel)

        const mockAdvert = createMockAdvert(
          StatusIdEnum.IN_PROGRESS,
          'admin-123',
        )
        jest
          .spyOn(advertModel, 'findOne')
          .mockResolvedValue(mockAdvert as AdvertModel)

        const context = createMockContext(adminUser, {
          publicationId: 'pub-123',
        })

        await guard.canActivate(context)

        expect(advertPublicationModel.findOne).toHaveBeenCalledWith({
          attributes: ['advertId'],
          where: { id: 'pub-123' },
        })
        expect(advertModel.findOne).toHaveBeenCalledWith({
          attributes: ['id', 'statusId', 'assignedUserId'],
          where: { id: 'advert-789' },
        })
        expect(logger.debug).toHaveBeenCalledWith(
          'Resolved advertId advert-789 from publicationId pub-123',
          expect.objectContaining({
            context: 'CanEditGuard',
            publicationId: 'pub-123',
            advertId: 'advert-789',
          }),
        )
      })

      it('should throw NotFoundException when publication does not exist', async () => {
        jest.spyOn(advertPublicationModel, 'findOne').mockResolvedValue(null)

        const context = createMockContext(adminUser, {
          publicationId: 'non-existent',
        })

        await expect(guard.canActivate(context)).rejects.toThrow(
          NotFoundException,
        )
        await expect(guard.canActivate(context)).rejects.toThrow(
          'Publication with id non-existent not found',
        )
        expect(logger.warn).toHaveBeenCalledWith(
          'Publication non-existent not found during advertId resolution',
          expect.objectContaining({
            context: 'CanEditGuard',
            publicationId: 'non-existent',
          }),
        )
      })

      it('should prioritize advertId over publicationId', async () => {
        const mockAdvert = createMockAdvert(
          StatusIdEnum.IN_PROGRESS,
          'admin-123',
        )
        jest
          .spyOn(advertModel, 'findOne')
          .mockResolvedValue(mockAdvert as AdvertModel)

        const context = createMockContext(adminUser, {
          advertId: 'advert-123',
          publicationId: 'pub-456',
        })

        await guard.canActivate(context)

        expect(advertModel.findOne).toHaveBeenCalledWith({
          attributes: ['id', 'statusId', 'assignedUserId'],
          where: { id: 'advert-123' },
        })
        expect(advertPublicationModel.findOne).not.toHaveBeenCalled()
      })
    })

    describe('advert existence validation', () => {
      it('should throw NotFoundException when advert does not exist', async () => {
        jest.spyOn(advertModel, 'findOne').mockResolvedValue(null)

        const context = createMockContext(adminUser, {
          advertId: 'non-existent',
        })

        await expect(guard.canActivate(context)).rejects.toThrow(
          NotFoundException,
        )
        await expect(guard.canActivate(context)).rejects.toThrow(
          'Advert with id non-existent not found',
        )
      })
    })

    describe('edit permission validation', () => {
      it('should return true when advert is IN_PROGRESS and assigned to admin', async () => {
        const mockAdvert = createMockAdvert(
          StatusIdEnum.IN_PROGRESS,
          'admin-123',
        )
        jest
          .spyOn(advertModel, 'findOne')
          .mockResolvedValue(mockAdvert as AdvertModel)

        const context = createMockContext(adminUser, {
          advertId: 'advert-123',
        })

        const result = await guard.canActivate(context)

        expect(result).toBe(true)
        expect(mockAdvert.canEdit).toHaveBeenCalledWith('admin-123')
        expect(logger.debug).toHaveBeenCalledWith(
          'Edit access granted for advert advert-123',
          expect.objectContaining({
            context: 'CanEditGuard',
            adminId: 'admin-123',
            advertId: 'advert-123',
          }),
        )
      })

      it('should return true when advert is READY_FOR_PUBLICATION and assigned to admin', async () => {
        const mockAdvert = createMockAdvert(
          StatusIdEnum.READY_FOR_PUBLICATION,
          'admin-123',
        )
        jest
          .spyOn(advertModel, 'findOne')
          .mockResolvedValue(mockAdvert as AdvertModel)

        const context = createMockContext(adminUser, {
          advertId: 'advert-123',
        })

        const result = await guard.canActivate(context)

        expect(result).toBe(true)
      })

      it('should return true when advert is SUBMITTED and assigned to admin', async () => {
        const mockAdvert = createMockAdvert(StatusIdEnum.SUBMITTED, 'admin-123')
        jest
          .spyOn(advertModel, 'findOne')
          .mockResolvedValue(mockAdvert as AdvertModel)

        const context = createMockContext(adminUser, {
          advertId: 'advert-123',
        })

        const result = await guard.canActivate(context)

        expect(result).toBe(true)
      })

      it('should throw ForbiddenException when advert is not in editable state', async () => {
        const mockAdvert = createMockAdvert(StatusIdEnum.PUBLISHED, 'admin-123')
        jest
          .spyOn(advertModel, 'findOne')
          .mockResolvedValue(mockAdvert as AdvertModel)

        const context = createMockContext(adminUser, {
          advertId: 'advert-123',
        })

        await expect(guard.canActivate(context)).rejects.toThrow(
          ForbiddenException,
        )
        await expect(guard.canActivate(context)).rejects.toThrow(
          'You do not have permission to edit this advert',
        )
        expect(logger.warn).toHaveBeenCalledWith(
          expect.stringContaining('cannot edit advert'),
          expect.objectContaining({
            context: 'CanEditGuard',
            adminId: 'admin-123',
            advertId: 'advert-123',
            status: StatusIdEnum.PUBLISHED,
          }),
        )
      })

      it('should throw ForbiddenException when advert is assigned to different admin', async () => {
        const mockAdvert = createMockAdvert(
          StatusIdEnum.IN_PROGRESS,
          'different-admin-456',
        )
        jest
          .spyOn(advertModel, 'findOne')
          .mockResolvedValue(mockAdvert as AdvertModel)

        const context = createMockContext(adminUser, {
          advertId: 'advert-123',
        })

        await expect(guard.canActivate(context)).rejects.toThrow(
          ForbiddenException,
        )
        expect(mockAdvert.canEdit).toHaveBeenCalledWith('admin-123')
      })

      it('should throw ForbiddenException for IN_PUBLISHING status', async () => {
        const mockAdvert = createMockAdvert(
          StatusIdEnum.IN_PUBLISHING,
          'admin-123',
        )
        jest
          .spyOn(advertModel, 'findOne')
          .mockResolvedValue(mockAdvert as AdvertModel)

        const context = createMockContext(adminUser, {
          advertId: 'advert-123',
        })

        await expect(guard.canActivate(context)).rejects.toThrow(
          ForbiddenException,
        )
      })

      it('should throw ForbiddenException for REJECTED status', async () => {
        const mockAdvert = createMockAdvert(StatusIdEnum.REJECTED, 'admin-123')
        jest
          .spyOn(advertModel, 'findOne')
          .mockResolvedValue(mockAdvert as AdvertModel)

        const context = createMockContext(adminUser, {
          advertId: 'advert-123',
        })

        await expect(guard.canActivate(context)).rejects.toThrow(
          ForbiddenException,
        )
      })

      it('should throw ForbiddenException for WITHDRAWN status', async () => {
        const mockAdvert = createMockAdvert(StatusIdEnum.WITHDRAWN, 'admin-123')
        jest
          .spyOn(advertModel, 'findOne')
          .mockResolvedValue(mockAdvert as AdvertModel)

        const context = createMockContext(adminUser, {
          advertId: 'advert-123',
        })

        await expect(guard.canActivate(context)).rejects.toThrow(
          ForbiddenException,
        )
      })
    })

    describe('edge cases', () => {
      it('should handle database errors gracefully', async () => {
        jest
          .spyOn(advertModel, 'findOne')
          .mockRejectedValue(new Error('Database connection failed'))

        const context = createMockContext(adminUser, {
          advertId: 'advert-123',
        })

        await expect(guard.canActivate(context)).rejects.toThrow(
          'Database connection failed',
        )
      })

      it('should handle errors during publicationId resolution', async () => {
        jest
          .spyOn(advertPublicationModel, 'findOne')
          .mockRejectedValue(new Error('Database error'))

        const context = createMockContext(adminUser, {
          publicationId: 'pub-123',
        })

        await expect(guard.canActivate(context)).rejects.toThrow(
          'Database error',
        )
        expect(logger.error).toHaveBeenCalledWith(
          'Error resolving advertId from publicationId pub-123',
          expect.objectContaining({
            context: 'CanEditGuard',
            error: 'Database error',
          }),
        )
      })
    })
  })
})

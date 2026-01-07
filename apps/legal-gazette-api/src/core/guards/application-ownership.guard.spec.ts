import { ExecutionContext, NotFoundException } from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test, TestingModule } from '@nestjs/testing'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { ApplicationModel } from '../../models/application.model'
import { ApplicationOwnershipGuard } from './application-ownership.guard'

describe('ApplicationOwnershipGuard', () => {
  let guard: ApplicationOwnershipGuard
  let applicationModel: typeof ApplicationModel
  let logger: Logger

  const mockApplication = {
    id: 'app-123',
    applicantNationalId: '1234567890',
  }

  const ownerUser: DMRUser = {
    nationalId: '1234567890',
    name: 'Owner User',
    fullName: 'Owner User',
    scope: [],
    actor: undefined,
    client: '',
    authorization: '',
  }

  const adminUser: DMRUser = {
    nationalId: '0123456789',
    name: 'Admin User',
    fullName: 'Admin User',
    scope: ['@logbirtingablad.is/admin'],
    actor: undefined,
    client: '',
    authorization: '',
  }

  const unauthorizedUser: DMRUser = {
    nationalId: '1111111111',
    name: 'Unauthorized User',
    fullName: 'Unauthorized User',
    scope: [],
    actor: undefined,
    client: '',
    authorization: '',
  }

  beforeEach(async () => {
    const mockApplicationModel = {
      findOneOrThrow: jest.fn(),
    }

    const mockLogger = {
      warn: jest.fn(),
      debug: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationOwnershipGuard,
        {
          provide: getModelToken(ApplicationModel),
          useValue: mockApplicationModel,
        },
        {
          provide: LOGGER_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile()

    guard = module.get<ApplicationOwnershipGuard>(ApplicationOwnershipGuard)
    applicationModel = module.get(getModelToken(ApplicationModel))
    logger = module.get(LOGGER_PROVIDER)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  const createMockContext = (
    user: DMRUser | null,
    applicationId: string,
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          params: { applicationId },
        }),
      }),
    } as ExecutionContext
  }

  describe('canActivate', () => {
    it('should allow access when user is the owner', async () => {
      jest
        .spyOn(applicationModel, 'findOneOrThrow')
        .mockResolvedValue(mockApplication as ApplicationModel)

      const context = createMockContext(ownerUser, 'app-123')
      const result = await guard.canActivate(context)

      expect(result).toBe(true)
      expect(applicationModel.findOneOrThrow).toHaveBeenCalledWith({
        where: { applicantNationalId: '1234567890', id: 'app-123' },
      })
      expect(logger.debug).toHaveBeenCalledWith(
        'Application ownership validated',
        expect.objectContaining({
          context: 'ApplicationOwnershipGuard',
          applicationId: 'app-123',
          userNationalId: '1234567890',
        }),
      )
    })

    it('should throw NotFoundException when application does not exist', async () => {
      jest
        .spyOn(applicationModel, 'findOneOrThrow')
        .mockRejectedValue(new NotFoundException())

      const context = createMockContext(ownerUser, 'non-existent')

      await expect(guard.canActivate(context)).rejects.toThrow(
        NotFoundException,
      )
      await expect(guard.canActivate(context)).rejects.toThrow('Not Found')
    })

    it('should throw ForbiddenException when user is not owner and not admin', async () => {
      jest
        .spyOn(applicationModel, 'findOneOrThrow')
        .mockRejectedValue(new NotFoundException())

      const context = createMockContext(unauthorizedUser, 'app-123')

      await expect(guard.canActivate(context)).rejects.toThrow(
        NotFoundException,
      )
      await expect(guard.canActivate(context)).rejects.toThrow('Not Found')
    })

    it('should allow access when user is both owner and admin', async () => {
      const ownerAndAdmin: DMRUser = {
        ...ownerUser,
      }

      jest
        .spyOn(applicationModel, 'findOneOrThrow')
        .mockResolvedValue(mockApplication as ApplicationModel)

      const context = createMockContext(ownerAndAdmin, 'app-123')
      const result = await guard.canActivate(context)

      expect(result).toBe(true)
      expect(logger.debug).toHaveBeenCalledWith(
        'Application ownership validated',
        expect.objectContaining({
          applicationId: 'app-123',
          userNationalId: '1234567890',
        }),
      )
    })

    it('should handle missing user in request', async () => {
      const context = createMockContext(null, 'app-123')

      await expect(guard.canActivate(context)).rejects.toThrow()
    })

    it('should handle missing applicationId in params', async () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: ownerUser,
            params: {},
          }),
        }),
      } as ExecutionContext

      await expect(guard.canActivate(context)).rejects.toThrow(
        NotFoundException,
      )
    })
  })
})

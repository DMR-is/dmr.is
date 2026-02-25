import { ExecutionContext, NotFoundException } from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test, TestingModule } from '@nestjs/testing'

import { type DMRUser } from '@dmr.is/auth/dmrUser'
import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { AdvertModel } from '../../models/advert.model'
import { ApplicationModel } from '../../models/application.model'
import { CaseModel } from '../../models/case.model'
import { OwnershipGuard } from './ownership.guard'
describe('OwnershipGuard', () => {
  let guard: OwnershipGuard
  let applicationModel: typeof ApplicationModel
  let advertModel: typeof AdvertModel
  let caseModel: typeof CaseModel
  let logger: Logger
  const ownerUser: DMRUser = {
    nationalId: '1234567890',
    name: 'Owner User',
    fullName: 'Owner User',
    scope: [],
    actor: undefined,
    client: '',
    authorization: '',
  }
  const mockApplication = {
    id: 'app-123',
    applicantNationalId: '1234567890',
  }
  const mockAdvert = {
    id: 'adv-123',
    createdByNationalId: '1234567890',
  }
  const mockCase = {
    id: 'case-123',
  }
  const adminUser: DMRUser = {
    adminUserId: 'isAdmin',
    nationalId: '0123456789',
    name: 'Admin User',
    fullName: 'Admin User',
    scope: [],
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
      findOne: jest.fn(),
    }
    const mockAdvertModel = {
      findOne: jest.fn(),
    }
    const mockCaseModel = {
      findOne: jest.fn(),
    }
    const mockLogger = {
      warn: jest.fn(),
      debug: jest.fn(),
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OwnershipGuard,
        {
          provide: getModelToken(ApplicationModel),
          useValue: mockApplicationModel,
        },
        {
          provide: getModelToken(AdvertModel),
          useValue: mockAdvertModel,
        },
        {
          provide: getModelToken(CaseModel),
          useValue: mockCaseModel,
        },
        {
          provide: LOGGER_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile()
    guard = module.get<OwnershipGuard>(OwnershipGuard)
    applicationModel = module.get(getModelToken(ApplicationModel))
    advertModel = module.get(getModelToken(AdvertModel))
    caseModel = module.get(getModelToken(CaseModel))
    logger = module.get(LOGGER_PROVIDER)
  })
  afterEach(() => {
    jest.clearAllMocks()
  })
  const createMockContext = (
    user: DMRUser | null,
    resourceId: string,
    type: 'application' | 'advert' | 'case' = 'application',
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          params: { [`${type}Id`]: resourceId },
        }),
      }),
    } as ExecutionContext
  }
  describe('canActivate', () => {
    it('should allow access when user is the owner for application', async () => {
      jest
        .spyOn(applicationModel, 'findOne')
        .mockResolvedValue(mockApplication as ApplicationModel)
      const context = createMockContext(ownerUser, 'app-123')
      const results = await guard.canActivate(context)
      expect(results).toBe(true)
      expect(applicationModel.findOne).toHaveBeenCalledWith({
        where: { id: 'app-123' },
        attributes: ['id', 'applicantNationalId'],
      })
      expect(logger.debug).toHaveBeenCalledWith(
        'Ownership validated',
        expect.objectContaining({
          context: 'OwnershipGuard',
          resourceId: 'app-123',
          userNationalId: '1234567890',
        }),
      )
    })
    it('should allow access when user is the owner for adverts', async () => {
      jest
        .spyOn(advertModel, 'findOne')
        .mockResolvedValue(mockAdvert as AdvertModel)
      const context = createMockContext(ownerUser, 'adv-123', 'advert')
      const results = await guard.canActivate(context)
      expect(results).toBe(true)
      expect(advertModel.findOne).toHaveBeenCalledWith({
        where: { id: 'adv-123' },
        attributes: ['id', 'createdByNationalId'],
      })
      expect(logger.debug).toHaveBeenCalledWith(
        'Ownership validated',
        expect.objectContaining({
          context: 'OwnershipGuard',
          resourceId: 'adv-123',
          userNationalId: '1234567890',
        }),
      )
    })
    it('should throw NotFoundException when application does not exist', async () => {
      jest
        .spyOn(applicationModel, 'findOne')
        .mockRejectedValue(new NotFoundException())
      const context = createMockContext(ownerUser, 'non-existent')
      await expect(guard.canActivate(context)).rejects.toThrow(
        NotFoundException,
      )
      await expect(guard.canActivate(context)).rejects.toThrow('Not Found')
    })
    it('should throw NotFoundException when advert does not exist', async () => {
      jest
        .spyOn(advertModel, 'findOne')
        .mockRejectedValue(new NotFoundException())
      const context = createMockContext(ownerUser, 'non-existent', 'advert')
      await expect(guard.canActivate(context)).rejects.toThrow(
        NotFoundException,
      )
      await expect(guard.canActivate(context)).rejects.toThrow('Not Found')
    })
    it('should throw NotFoundException when case does not exist', async () => {
      jest
        .spyOn(caseModel, 'findOne')
        .mockRejectedValue(new NotFoundException())
      const context = createMockContext(ownerUser, 'non-existent', 'case')
      await expect(guard.canActivate(context)).rejects.toThrow(
        NotFoundException,
      )
      await expect(guard.canActivate(context)).rejects.toThrow('Not Found')
    })
    it('should throw NotFoundException when user is not owner and not admin for application', async () => {
      jest
        .spyOn(applicationModel, 'findOne')
        .mockRejectedValue(new NotFoundException())
      const context = createMockContext(unauthorizedUser, 'app-123')
      await expect(guard.canActivate(context)).rejects.toThrow(
        NotFoundException,
      )
      await expect(guard.canActivate(context)).rejects.toThrow('Not Found')
    })
    it('should throw NotFoundException when user is not owner and not admin for advert', async () => {
      jest
        .spyOn(advertModel, 'findOne')
        .mockRejectedValue(new NotFoundException())
      const context = createMockContext(unauthorizedUser, 'adv-123', 'advert')
      await expect(guard.canActivate(context)).rejects.toThrow(
        NotFoundException,
      )
      await expect(guard.canActivate(context)).rejects.toThrow('Not Found')
    })
    it('should throw NotFoundException when user is not admin for case', async () => {
      jest
        .spyOn(caseModel, 'findOne')
        .mockRejectedValue(new NotFoundException())
      const context = createMockContext(unauthorizedUser, 'case-123', 'case')
      await expect(guard.canActivate(context)).rejects.toThrow(
        NotFoundException,
      )
      await expect(guard.canActivate(context)).rejects.toThrow('Not Found')
    })
    it('should allow access when user is both owner and admin', async () => {
      const ownerAndAdmin: DMRUser = {
        ...ownerUser,
        adminUserId: 'isAdmin',
      }
      jest
        .spyOn(applicationModel, 'findOne')
        .mockResolvedValue(mockApplication as ApplicationModel)
      const context = createMockContext(ownerAndAdmin, 'app-123')
      const result = await guard.canActivate(context)
      expect(result).toBe(true)
      expect(logger.debug).toHaveBeenCalledWith(
        'Ownership validated',
        expect.objectContaining({
          resourceId: 'app-123',
          userNationalId: '1234567890',
        }),
      )
    })
    it('should allow access when user is only admin for application', async () => {
      const onlyAdmin: DMRUser = {
        ...adminUser,
      }
      jest
        .spyOn(applicationModel, 'findOne')
        .mockResolvedValue(mockApplication as ApplicationModel)
      const context = createMockContext(onlyAdmin, 'app-123')
      const result = await guard.canActivate(context)
      expect(result).toBe(true)
      expect(logger.debug).toHaveBeenCalledWith(
        'Ownership validated',
        expect.objectContaining({
          resourceId: 'app-123',
          userNationalId: onlyAdmin.nationalId,
          isAdmin: true,
        }),
      )
    })
    it('should allow access when user is only admin for advert', async () => {
      const onlyAdmin: DMRUser = {
        ...adminUser,
      }
      jest
        .spyOn(advertModel, 'findOne')
        .mockResolvedValue(mockAdvert as AdvertModel)
      const context = createMockContext(onlyAdmin, 'adv-123', 'advert')
      const result = await guard.canActivate(context)
      expect(result).toBe(true)
      expect(logger.debug).toHaveBeenCalledWith(
        'Ownership validated',
        expect.objectContaining({
          resourceId: 'adv-123',
          userNationalId: onlyAdmin.nationalId,
          isAdmin: true,
        }),
      )
    })
    it('should allow access when user is only admin for case', async () => {
      const onlyAdmin: DMRUser = {
        ...adminUser,
      }
      jest.spyOn(caseModel, 'findOne').mockResolvedValue(mockCase as CaseModel)
      const context = createMockContext(onlyAdmin, 'case-123', 'case')
      const result = await guard.canActivate(context)
      expect(result).toBe(true)
      expect(logger.debug).toHaveBeenCalledWith(
        'Ownership validated',
        expect.objectContaining({
          resourceId: 'case-123',
          userNationalId: onlyAdmin.nationalId,
          isAdmin: true,
        }),
      )
    })
    it('should handle missing user in request', async () => {
      const context = createMockContext(null, 'app-123')
      await expect(guard.canActivate(context)).rejects.toThrow()
    })
    it('should handle missing resourceId in params', async () => {
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

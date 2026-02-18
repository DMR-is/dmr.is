import { ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Test, TestingModule } from '@nestjs/testing'

import { ADMIN_KEY } from '../../core/decorators/admin.decorator'
import { AuthorizationGuard } from '../../core/guards/authorization.guard'
import { UserDto } from '../../models/users.model'
import { IUsersService } from '../users/users.service.interface'
import { PdfAdminController } from './pdf-admin.controller'
import { IPdfAdminService } from './pdf-admin.service.interface'
const ADMIN_NATIONAL_ID = '1234567890'
const NON_ADMIN_NATIONAL_ID = '0987654321'
interface MockUser {
  nationalId?: string
  scope?: string
}
const createAdminUser = (): MockUser => ({
  nationalId: ADMIN_NATIONAL_ID,
  scope: '',
})
const createNonAdminUser = (): MockUser => ({
  nationalId: NON_ADMIN_NATIONAL_ID,
  scope: '',
})
const createMockUserDto = (nationalId: string): UserDto => ({
  id: 'user-123',
  nationalId,
  name: 'Admin User',
  email: 'admin@test.com',
  phone: '1234567',
  isActive: true,
})
describe('PdfAdminController - Guard Authorization', () => {
  let authorizationGuard: AuthorizationGuard
  let reflector: Reflector
  let usersService: jest.Mocked<IUsersService>
  const createMockContext = (
    user: MockUser | null,
    methodName: keyof PdfAdminController,
  ): ExecutionContext => {
    const mockRequest = { user }
    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
      getHandler: () =>
        PdfAdminController.prototype[methodName] as unknown as () => void,
      getClass: () => PdfAdminController,
    } as unknown as ExecutionContext
  }
  beforeEach(async () => {
    const mockUsersService = {
      getUserByNationalId: jest
        .fn()
        .mockImplementation((nationalId: string) => {
          if (nationalId === ADMIN_NATIONAL_ID) {
            return Promise.resolve(createMockUserDto(nationalId))
          }
          throw new Error('User not found')
        }),
      getEmployees: jest.fn(),
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorizationGuard,
        Reflector,
        {
          provide: IUsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile()
    authorizationGuard = module.get<AuthorizationGuard>(AuthorizationGuard)
    reflector = module.get<Reflector>(Reflector)
    usersService = module.get(IUsersService)
  })
  afterEach(() => {
    jest.clearAllMocks()
  })
  describe('Decorator configuration verification', () => {
    it('controller class should have @AdminAccess()', () => {
      const isAdminAccess = reflector.getAllAndOverride<boolean>(ADMIN_KEY, [
        PdfAdminController.prototype.regeneratePdf,
        PdfAdminController,
      ])
      expect(isAdminAccess).toBe(true)
    })
    it('regeneratePdf method should exist on controller', () => {
      expect(PdfAdminController.prototype.regeneratePdf).toBeDefined()
    })
  })
  describe('regeneratePdf - @AdminAccess() (class-level)', () => {
    it('should ALLOW admin users', async () => {
      const context = createMockContext(createAdminUser(), 'regeneratePdf')
      const result = await authorizationGuard.canActivate(context)
      expect(result).toBe(true)
      expect(usersService.getUserByNationalId).toHaveBeenCalledWith(
        ADMIN_NATIONAL_ID,
        true,
      )
    })
    it('should DENY non-admin users', async () => {
      const context = createMockContext(createNonAdminUser(), 'regeneratePdf')
      await expect(authorizationGuard.canActivate(context)).rejects.toThrow()
      expect(usersService.getUserByNationalId).toHaveBeenCalledWith(
        NON_ADMIN_NATIONAL_ID,
        true,
      )
    })
    it('should DENY unauthenticated requests', async () => {
      const context = createMockContext(null, 'regeneratePdf')
      await expect(authorizationGuard.canActivate(context)).rejects.toThrow()
    })
  })
  describe('Service delegation', () => {
    it('should delegate to pdfAdminService.regeneratePdf', () => {
      const mockService = {
        regeneratePdf: jest.fn().mockResolvedValue({
          pdfUrl: 'https://example.com/pdf',
          message: 'PDF regenerated successfully',
        }),
      }
      const controller = new PdfAdminController(mockService as any)
      const user = { adminUserId: 'admin-1', nationalId: '1234567890' }
      controller.regeneratePdf('advert-id', 'pub-id', user as any)
      expect(mockService.regeneratePdf).toHaveBeenCalledWith(
        'advert-id',
        'pub-id',
        user,
      )
    })
  })
})

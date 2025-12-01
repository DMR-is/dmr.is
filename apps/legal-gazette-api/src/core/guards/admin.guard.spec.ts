import { ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Test, TestingModule } from '@nestjs/testing'

import { SCOPES_KEY } from '@dmr.is/modules/guards/auth'

import { UserDto } from '../../models/users.model'
import { IUsersService } from '../../modules/users/users.service.interface'
import { ADMIN_KEY } from '../decorators/admin.decorator'
import { AdminGuard } from './admin.guard'

interface MockUser {
  nationalId?: string
  scope?: string
}

describe('AdminGuard', () => {
  let guard: AdminGuard
  let reflector: Reflector
  let usersService: jest.Mocked<IUsersService>

  // Helper to create mock ExecutionContext
  const createMockContext = (user: MockUser | null = null): ExecutionContext => {
    const mockRequest = { user }
    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext
  }

  // Helper to create a mock UserDto
  const createMockUserDto = (nationalId = '1234567890'): UserDto => ({
    id: 'user-123',
    nationalId,
    name: 'Test User',
    email: 'test@test.com',
    phone: '1234567',
  })

  // Error thrown when user is not found in database (simulates findOneOrThrow)
  const userNotFoundError = new Error('User not found')

  beforeEach(async () => {
    const mockUsersService = {
      getUserByNationalId: jest.fn(),
      getEmployees: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: IUsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile()

    guard = module.get<AdminGuard>(AdminGuard)
    reflector = module.get<Reflector>(Reflector)
    usersService = module.get(IUsersService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('when @AdminOnly() decorator is NOT present', () => {
    beforeEach(() => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined)
    })

    it('should allow access without any checks', async () => {
      const context = createMockContext()

      const result = await guard.canActivate(context)

      expect(result).toBe(true)
      expect(usersService.getUserByNationalId).not.toHaveBeenCalled()
    })

    it('should allow access even without user in request', async () => {
      const context = createMockContext(null)

      const result = await guard.canActivate(context)

      expect(result).toBe(true)
    })
  })

  describe('when @AdminOnly() decorator IS present (admin-only mode)', () => {
    beforeEach(() => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === ADMIN_KEY) return true
        if (key === SCOPES_KEY) return undefined
        return undefined
      })
    })

    describe('and user has no nationalId', () => {
      it('should throw ForbiddenException', async () => {
        const context = createMockContext({})

        await expect(guard.canActivate(context)).rejects.toThrow(
          ForbiddenException,
        )
      })

      it('should throw ForbiddenException when user is null', async () => {
        const context = createMockContext(null)

        await expect(guard.canActivate(context)).rejects.toThrow(
          ForbiddenException,
        )
      })
    })

    describe('and user has nationalId', () => {
      const mockUser = { nationalId: '1234567890' }

      it('should allow access when user exists in database (is admin)', async () => {
        const context = createMockContext(mockUser)
        usersService.getUserByNationalId.mockResolvedValue(
          createMockUserDto('1234567890'),
        )

        const result = await guard.canActivate(context)

        expect(result).toBe(true)
        expect(usersService.getUserByNationalId).toHaveBeenCalledWith(
          '1234567890',
        )
      })

      it('should throw ForbiddenException when user does not exist in database', async () => {
        const context = createMockContext(mockUser)
        // Service throws when user not found (findOneOrThrow behavior)
        usersService.getUserByNationalId.mockRejectedValue(userNotFoundError)

        await expect(guard.canActivate(context)).rejects.toThrow(
          ForbiddenException,
        )
      })

      it('should throw ForbiddenException when database error occurs', async () => {
        const context = createMockContext(mockUser)
        usersService.getUserByNationalId.mockRejectedValue(
          new Error('Database connection error'),
        )

        await expect(guard.canActivate(context)).rejects.toThrow(
          ForbiddenException,
        )
      })
    })
  })

  describe('when @AdminOnly() AND scope decorators are present (OR logic)', () => {
    const requiredScopes = ['@dmr.is/lg-application-web']

    beforeEach(() => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === ADMIN_KEY) return true
        if (key === SCOPES_KEY) return requiredScopes
        return undefined
      })
    })

    describe('and user is admin (exists in database)', () => {
      it('should allow access regardless of scopes', async () => {
        const context = createMockContext({
          nationalId: '1234567890',
          scope: '', // No scopes
        })
        usersService.getUserByNationalId.mockResolvedValue(
          createMockUserDto('1234567890'),
        )

        const result = await guard.canActivate(context)

        expect(result).toBe(true)
      })

      it('should allow access even with non-matching scopes', async () => {
        const context = createMockContext({
          nationalId: '1234567890',
          scope: '@dmr.is/lg-public-web', // Different scope
        })
        usersService.getUserByNationalId.mockResolvedValue(
          createMockUserDto('1234567890'),
        )

        const result = await guard.canActivate(context)

        expect(result).toBe(true)
      })
    })

    describe('and user is NOT admin (not in database)', () => {
      beforeEach(() => {
        // Service throws when user not found
        usersService.getUserByNationalId.mockRejectedValue(userNotFoundError)
      })

      it('should allow access when user has matching scope', async () => {
        const context = createMockContext({
          nationalId: '1234567890',
          scope: '@dmr.is/lg-application-web @dmr.is/other-scope',
        })

        const result = await guard.canActivate(context)

        expect(result).toBe(true)
      })

      it('should deny access when user has no matching scope', async () => {
        const context = createMockContext({
          nationalId: '1234567890',
          scope: '@dmr.is/lg-public-web',
        })

        await expect(guard.canActivate(context)).rejects.toThrow(
          ForbiddenException,
        )
      })

      it('should deny access when user has no scopes', async () => {
        const context = createMockContext({
          nationalId: '1234567890',
          scope: '',
        })

        await expect(guard.canActivate(context)).rejects.toThrow(
          ForbiddenException,
        )
      })

      it('should deny access when user scope is undefined', async () => {
        const context = createMockContext({
          nationalId: '1234567890',
        })

        await expect(guard.canActivate(context)).rejects.toThrow(
          ForbiddenException,
        )
      })
    })

    describe('and admin lookup fails with database error', () => {
      beforeEach(() => {
        usersService.getUserByNationalId.mockRejectedValue(
          new Error('Database connection error'),
        )
      })

      it('should fall back to scope check and allow if scope matches', async () => {
        const context = createMockContext({
          nationalId: '1234567890',
          scope: '@dmr.is/lg-application-web',
        })

        const result = await guard.canActivate(context)

        expect(result).toBe(true)
      })

      it('should deny access if scope does not match', async () => {
        const context = createMockContext({
          nationalId: '1234567890',
          scope: '@dmr.is/lg-public-web',
        })

        await expect(guard.canActivate(context)).rejects.toThrow(
          ForbiddenException,
        )
      })
    })
  })

  describe('with multiple scopes (AllWebAppsScopes pattern)', () => {
    const requiredScopes = [
      '@dmr.is/lg-public-web',
      '@dmr.is/lg-application-web',
    ]

    beforeEach(() => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === ADMIN_KEY) return true
        if (key === SCOPES_KEY) return requiredScopes
        return undefined
      })
      // User is not admin
      usersService.getUserByNationalId.mockRejectedValue(userNotFoundError)
    })

    it('should allow access for public-web user', async () => {
      const context = createMockContext({
        nationalId: '1234567890',
        scope: '@dmr.is/lg-public-web',
      })

      const result = await guard.canActivate(context)

      expect(result).toBe(true)
    })

    it('should allow access for application-web user', async () => {
      const context = createMockContext({
        nationalId: '1234567890',
        scope: '@dmr.is/lg-application-web',
      })

      const result = await guard.canActivate(context)

      expect(result).toBe(true)
    })

    it('should deny access for user with unrelated scope', async () => {
      const context = createMockContext({
        nationalId: '1234567890',
        scope: '@dmr.is/other-scope',
      })

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      )
    })
  })

  describe('edge cases', () => {
    beforeEach(() => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === ADMIN_KEY) return true
        if (key === SCOPES_KEY) return ['@dmr.is/lg-application-web']
        return undefined
      })
      usersService.getUserByNationalId.mockRejectedValue(userNotFoundError)
    })

    it('should handle user with multiple scopes separated by space', async () => {
      const context = createMockContext({
        nationalId: '1234567890',
        scope: 'scope1 @dmr.is/lg-application-web scope3',
      })

      const result = await guard.canActivate(context)

      expect(result).toBe(true)
    })

    it('should rethrow ForbiddenException from usersService', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === ADMIN_KEY) return true
        return undefined // No scopes defined
      })
      usersService.getUserByNationalId.mockRejectedValue(
        new ForbiddenException('Custom forbidden message'),
      )

      const context = createMockContext({
        nationalId: '1234567890',
      })

      await expect(guard.canActivate(context)).rejects.toThrow(
        'Custom forbidden message',
      )
    })

    it('should handle scope matching with exact string match', async () => {
      const context = createMockContext({
        nationalId: '1234567890',
        scope: '@dmr.is/lg-application-web-extended', // Similar but not exact
      })

      // Should NOT match because it's not an exact match
      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      )
    })
  })
})

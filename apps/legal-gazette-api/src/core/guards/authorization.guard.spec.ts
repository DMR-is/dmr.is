import { ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Test, TestingModule } from '@nestjs/testing'

import { SCOPES_KEY } from '@dmr.is/ojoi/modules/guards/auth'

import { UserDto } from '../../models/users.model'
import { IUsersService } from '../../modules/users/users.service.interface'
import { ADMIN_KEY } from '../decorators/admin.decorator'
import { AuthorizationGuard } from './authorization.guard'

interface MockUser {
  nationalId?: string
  scope?: string
}

describe('AuthorizationGuard', () => {
  let guard: AuthorizationGuard
  let reflector: Reflector
  let usersService: jest.Mocked<IUsersService>

  // Helper to create mock ExecutionContext
  const createMockContext = (
    user: MockUser | null = null,
  ): ExecutionContext => {
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
    isActive: true,
  })

  // Error thrown when user is not found in database
  const userNotFoundError = new Error('User not found')

  beforeEach(async () => {
    const mockUsersService = {
      getUserByNationalId: jest.fn(),
      getEmployees: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorizationGuard,
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

    guard = module.get<AuthorizationGuard>(AuthorizationGuard)
    reflector = module.get<Reflector>(Reflector)
    usersService = module.get(IUsersService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  // ==========================================
  // Case 1: No decorators - auth only
  // ==========================================
  describe('Case 1: No decorators (auth only)', () => {
    beforeEach(() => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined)
    })

    it('should allow access without any checks', async () => {
      const context = createMockContext({ nationalId: '1234567890' })

      const result = await guard.canActivate(context)

      expect(result).toBe(true)
      expect(usersService.getUserByNationalId).not.toHaveBeenCalled()
    })

    it('should allow access even without user in request', async () => {
      const context = createMockContext(null)

      const result = await guard.canActivate(context)

      expect(result).toBe(true)
      expect(usersService.getUserByNationalId).not.toHaveBeenCalled()
    })

    it('should allow access with empty user object', async () => {
      const context = createMockContext({})

      const result = await guard.canActivate(context)

      expect(result).toBe(true)
      expect(usersService.getUserByNationalId).not.toHaveBeenCalled()
    })

    it('should not perform database lookup', async () => {
      const context = createMockContext({ nationalId: '1234567890' })

      await guard.canActivate(context)

      expect(usersService.getUserByNationalId).not.toHaveBeenCalled()
    })
  })

  // ==========================================
  // Case 2: @Scopes() only - scope check without user lookup
  // ==========================================
  describe('Case 2: @Scopes() only (scope check, no user lookup)', () => {
    const requiredScopes = ['@logbirtingablad.is/logbirtingabladid']

    beforeEach(() => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === ADMIN_KEY) return undefined
        if (key === SCOPES_KEY) return requiredScopes
        return undefined
      })
    })

    it('should allow access when user has matching scope', async () => {
      const context = createMockContext({
        nationalId: '1234567890',
        scope: '@logbirtingablad.is/logbirtingabladid',
      })

      const result = await guard.canActivate(context)

      expect(result).toBe(true)
    })

    it('should allow access when user has matching scope among multiple', async () => {
      const context = createMockContext({
        nationalId: '1234567890',
        scope:
          '@dmr.is/some-other @logbirtingablad.is/logbirtingabladid @dmr.is/another',
      })

      const result = await guard.canActivate(context)

      expect(result).toBe(true)
    })

    it('should deny access when user scope does not match', async () => {
      const context = createMockContext({
        nationalId: '1234567890',
        scope: '@logbirtingablad.is/lg-application-web',
      })

      const result = await guard.canActivate(context)

      expect(result).toBe(false)
    })

    it('should deny access when user has no scope', async () => {
      const context = createMockContext({
        nationalId: '1234567890',
        scope: '',
      })

      const result = await guard.canActivate(context)

      expect(result).toBe(false)
    })

    it('should deny access when user scope is undefined', async () => {
      const context = createMockContext({
        nationalId: '1234567890',
      })

      const result = await guard.canActivate(context)

      expect(result).toBe(false)
    })

    it('should deny access when no user in request', async () => {
      const context = createMockContext(null)

      const result = await guard.canActivate(context)

      expect(result).toBe(false)
    })

    it('should NOT perform database lookup (optimization)', async () => {
      const context = createMockContext({
        nationalId: '1234567890',
        scope: '@logbirtingablad.is/logbirtingabladid',
      })

      await guard.canActivate(context)

      expect(usersService.getUserByNationalId).not.toHaveBeenCalled()
    })

    describe('with multiple required scopes', () => {
      beforeEach(() => {
        jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
          if (key === ADMIN_KEY) return undefined
          if (key === SCOPES_KEY)
            return [
              '@logbirtingablad.is/logbirtingabladid',
              '@logbirtingablad.is/lg-application-web',
            ]
          return undefined
        })
      })

      it('should allow when user has one of the required scopes', async () => {
        const context = createMockContext({
          nationalId: '1234567890',
          scope: '@logbirtingablad.is/lg-application-web',
        })

        const result = await guard.canActivate(context)

        expect(result).toBe(true)
      })

      it('should allow when user has both required scopes', async () => {
        const context = createMockContext({
          nationalId: '1234567890',
          scope:
            '@logbirtingablad.is/logbirtingabladid @logbirtingablad.is/lg-application-web',
        })

        const result = await guard.canActivate(context)

        expect(result).toBe(true)
      })
    })
  })

  // ==========================================
  // Case 3: @AdminAccess() only - admin check with user lookup
  // ==========================================
  describe('Case 3: @AdminAccess() only (admin check with user lookup)', () => {
    beforeEach(() => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === ADMIN_KEY) return true
        if (key === SCOPES_KEY) return undefined
        return undefined
      })
    })

    describe('when user is admin (exists in database)', () => {
      it('should allow access', async () => {
        const context = createMockContext({ nationalId: '1234567890' })
        usersService.getUserByNationalId.mockResolvedValue(
          createMockUserDto('1234567890'),
        )

        const result = await guard.canActivate(context)

        expect(result).toBe(true)
      })

      it('should perform database lookup', async () => {
        const context = createMockContext({ nationalId: '1234567890' })
        usersService.getUserByNationalId.mockResolvedValue(
          createMockUserDto('1234567890'),
        )

        await guard.canActivate(context)

        expect(usersService.getUserByNationalId).toHaveBeenCalledWith(
          '1234567890',
          true,
        )
      })

      it('should allow access even without scopes', async () => {
        const context = createMockContext({
          nationalId: '1234567890',
          scope: '',
        })
        usersService.getUserByNationalId.mockResolvedValue(
          createMockUserDto('1234567890'),
        )

        const result = await guard.canActivate(context)

        expect(result).toBe(true)
      })
    })

    describe('when user is NOT admin', () => {
      it('should throw ForbiddenException when user not in database', async () => {
        const context = createMockContext({ nationalId: '1234567890' })
        // Service throws when user not found (findOneOrThrow behavior)
        usersService.getUserByNationalId.mockRejectedValue(userNotFoundError)

        await expect(guard.canActivate(context)).rejects.toThrow(
          ForbiddenException,
        )
      })

      it('should throw ForbiddenException when database lookup throws', async () => {
        const context = createMockContext({ nationalId: '1234567890' })
        usersService.getUserByNationalId.mockRejectedValue(userNotFoundError)

        await expect(guard.canActivate(context)).rejects.toThrow(
          ForbiddenException,
        )
      })

      it('should throw ForbiddenException on database error', async () => {
        const context = createMockContext({ nationalId: '1234567890' })
        usersService.getUserByNationalId.mockRejectedValue(
          new Error('Database connection error'),
        )

        await expect(guard.canActivate(context)).rejects.toThrow(
          ForbiddenException,
        )
      })
    })

    describe('when user has no nationalId', () => {
      it('should throw ForbiddenException with empty user', async () => {
        const context = createMockContext({})

        await expect(guard.canActivate(context)).rejects.toThrow(
          ForbiddenException,
        )
      })

      it('should throw ForbiddenException with null user', async () => {
        const context = createMockContext(null)

        await expect(guard.canActivate(context)).rejects.toThrow(
          ForbiddenException,
        )
      })

      it('should not perform database lookup when no nationalId', async () => {
        const context = createMockContext({})

        try {
          await guard.canActivate(context)
        } catch {
          // Expected to throw
        }

        expect(usersService.getUserByNationalId).not.toHaveBeenCalled()
      })
    })
  })

  // ==========================================
  // Case 4: @AdminAccess() + @Scopes() - OR logic
  // ==========================================
  describe('Case 4: @AdminAccess() + @Scopes() (OR logic)', () => {
    const requiredScopes = ['@logbirtingablad.is/lg-application-web']

    beforeEach(() => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === ADMIN_KEY) return true
        if (key === SCOPES_KEY) return requiredScopes
        return undefined
      })
    })

    describe('when user is admin', () => {
      it('should allow access without scope check', async () => {
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

      it('should allow access even with non-matching scope', async () => {
        const context = createMockContext({
          nationalId: '1234567890',
          scope: '@logbirtingablad.is/logbirtingabladid', // Different scope
        })
        usersService.getUserByNationalId.mockResolvedValue(
          createMockUserDto('1234567890'),
        )

        const result = await guard.canActivate(context)

        expect(result).toBe(true)
      })

      it('should allow access with matching scope too', async () => {
        const context = createMockContext({
          nationalId: '1234567890',
          scope: '@logbirtingablad.is/lg-application-web',
        })
        usersService.getUserByNationalId.mockResolvedValue(
          createMockUserDto('1234567890'),
        )

        const result = await guard.canActivate(context)

        expect(result).toBe(true)
      })
    })

    describe('when user is NOT admin but has valid scope', () => {
      it('should allow access via scope (OR logic)', async () => {
        const context = createMockContext({
          nationalId: '1234567890',
          scope: '@logbirtingablad.is/lg-application-web',
        })
        usersService.getUserByNationalId.mockRejectedValue(userNotFoundError) // Not admin

        const result = await guard.canActivate(context)

        expect(result).toBe(true)
      })

      it('should allow access when admin lookup throws but scope matches', async () => {
        const context = createMockContext({
          nationalId: '1234567890',
          scope: '@logbirtingablad.is/lg-application-web',
        })
        usersService.getUserByNationalId.mockRejectedValue(userNotFoundError)

        const result = await guard.canActivate(context)

        expect(result).toBe(true)
      })

      it('should allow access when user has matching scope among multiple', async () => {
        const context = createMockContext({
          nationalId: '1234567890',
          scope:
            '@dmr.is/other @logbirtingablad.is/lg-application-web @dmr.is/another',
        })
        usersService.getUserByNationalId.mockRejectedValue(userNotFoundError)

        const result = await guard.canActivate(context)

        expect(result).toBe(true)
      })
    })

    describe('when user is NOT admin and has NO valid scope', () => {
      it('should throw ForbiddenException', async () => {
        const context = createMockContext({
          nationalId: '1234567890',
          scope: '@logbirtingablad.is/logbirtingabladid', // Wrong scope
        })
        usersService.getUserByNationalId.mockRejectedValue(userNotFoundError)

        await expect(guard.canActivate(context)).rejects.toThrow(
          ForbiddenException,
        )
      })

      it('should throw ForbiddenException with empty scope', async () => {
        const context = createMockContext({
          nationalId: '1234567890',
          scope: '',
        })
        usersService.getUserByNationalId.mockRejectedValue(userNotFoundError)

        await expect(guard.canActivate(context)).rejects.toThrow(
          ForbiddenException,
        )
      })

      it('should throw ForbiddenException with no scope', async () => {
        const context = createMockContext({
          nationalId: '1234567890',
        })
        usersService.getUserByNationalId.mockRejectedValue(userNotFoundError)

        await expect(guard.canActivate(context)).rejects.toThrow(
          ForbiddenException,
        )
      })
    })

    describe('when user has no nationalId', () => {
      it('should still allow if scope matches (edge case)', async () => {
        // This tests the scenario where a user might have a scope
        // but no nationalId (unlikely but possible with malformed tokens)
        const context = createMockContext({
          scope: '@logbirtingablad.is/lg-application-web',
        })

        const result = await guard.canActivate(context)

        expect(result).toBe(true)
        // Should not attempt admin lookup without nationalId
        expect(usersService.getUserByNationalId).not.toHaveBeenCalled()
      })

      it('should throw if no nationalId and scope does not match', async () => {
        const context = createMockContext({
          scope: '@logbirtingablad.is/logbirtingabladid', // Wrong scope
        })

        await expect(guard.canActivate(context)).rejects.toThrow(
          ForbiddenException,
        )
      })
    })

    describe('database lookup optimization', () => {
      it('should skip database lookup when scope matches (optimization)', async () => {
        const context = createMockContext({
          nationalId: '1234567890',
          scope: '@logbirtingablad.is/lg-application-web',
        })
        usersService.getUserByNationalId.mockRejectedValue(userNotFoundError)

        await guard.canActivate(context)

        expect(usersService.getUserByNationalId).toHaveBeenCalledTimes(0)
      })

      it('should call database lookup exactly once when scope does not match', async () => {
        const context = createMockContext({
          nationalId: '1234567890',
          scope: '@logbirtingablad.is/logbirtingabladid', // Wrong scope
        })
        usersService.getUserByNationalId.mockRejectedValue(userNotFoundError)

        try {
          await guard.canActivate(context)
        } catch {
          // Expected to throw
        }

        expect(usersService.getUserByNationalId).toHaveBeenCalledTimes(1)
      })
    })
  })

  // ==========================================
  // Mixed decorator scenarios
  // ==========================================
  describe('Mixed decorator scenarios', () => {
    describe('with multiple scopes in @Scopes() decorator', () => {
      beforeEach(() => {
        jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
          if (key === ADMIN_KEY) return true
          if (key === SCOPES_KEY)
            return [
              '@logbirtingablad.is/logbirtingabladid',
              '@logbirtingablad.is/lg-application-web',
            ]
          return undefined
        })
      })

      it('should allow admin with any scope', async () => {
        const context = createMockContext({
          nationalId: '1234567890',
          scope: '@dmr.is/unrelated-scope',
        })
        usersService.getUserByNationalId.mockResolvedValue(
          createMockUserDto('1234567890'),
        )

        const result = await guard.canActivate(context)

        expect(result).toBe(true)
      })

      it('should allow non-admin with first matching scope', async () => {
        const context = createMockContext({
          nationalId: '1234567890',
          scope: '@logbirtingablad.is/logbirtingabladid',
        })
        usersService.getUserByNationalId.mockRejectedValue(userNotFoundError)

        const result = await guard.canActivate(context)

        expect(result).toBe(true)
      })

      it('should allow non-admin with second matching scope', async () => {
        const context = createMockContext({
          nationalId: '1234567890',
          scope: '@logbirtingablad.is/lg-application-web',
        })
        usersService.getUserByNationalId.mockRejectedValue(userNotFoundError)

        const result = await guard.canActivate(context)

        expect(result).toBe(true)
      })

      it('should deny non-admin without any matching scope', async () => {
        const context = createMockContext({
          nationalId: '1234567890',
          scope: '@dmr.is/some-other-scope',
        })
        usersService.getUserByNationalId.mockRejectedValue(userNotFoundError)

        await expect(guard.canActivate(context)).rejects.toThrow(
          ForbiddenException,
        )
      })
    })
  })

  // ==========================================
  // Error message tests
  // ==========================================
  describe('Error messages', () => {
    it('should throw ForbiddenException with "Admin access required" message', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === ADMIN_KEY) return true
        if (key === SCOPES_KEY) return undefined
        return undefined
      })
      const context = createMockContext({ nationalId: '1234567890' })
      usersService.getUserByNationalId.mockRejectedValue(userNotFoundError)

      await expect(guard.canActivate(context)).rejects.toThrow(
        'Admin access required',
      )
    })
  })

  // ==========================================
  // Edge cases
  // ==========================================
  describe('Edge cases', () => {
    it('should handle undefined scope gracefully', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === ADMIN_KEY) return false
        if (key === SCOPES_KEY) return ['@logbirtingablad.is/logbirtingabladid']
        return undefined
      })
      const context = createMockContext({
        nationalId: '1234567890',
        scope: undefined,
      })

      const result = await guard.canActivate(context)

      expect(result).toBe(false)
    })

    it('should handle empty scopes array from reflector', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === ADMIN_KEY) return false
        if (key === SCOPES_KEY) return []
        return undefined
      })
      const context = createMockContext({ nationalId: '1234567890' })

      const result = await guard.canActivate(context)

      // Empty scopes array is treated as "no scopes required"
      expect(result).toBe(true)
    })

    it('should handle whitespace-only scope string', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === ADMIN_KEY) return false
        if (key === SCOPES_KEY) return ['@logbirtingablad.is/logbirtingabladid']
        return undefined
      })
      const context = createMockContext({
        nationalId: '1234567890',
        scope: '   ',
      })

      const result = await guard.canActivate(context)

      expect(result).toBe(false)
    })
  })
})

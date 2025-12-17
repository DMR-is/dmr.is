import { ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Test, TestingModule } from '@nestjs/testing'

import { SCOPES_KEY, ScopesGuard } from '@dmr.is/modules/guards/auth'

import { ADMIN_KEY } from '../../../core/decorators/admin.decorator'
import { AuthorizationGuard } from '../../../core/guards/authorization.guard'
import { UserDto } from '../../../models/users.model'
import { IUsersService } from '../../users/users.service.interface'
import { AdvertController } from './advert.controller'

// Test constants
const ADMIN_NATIONAL_ID = '1234567890'
const PUBLIC_WEB_NATIONAL_ID = '0987654321'
const APPLICATION_WEB_NATIONAL_ID = '1122334455'
const RANDOM_NATIONAL_ID = '5566778899'

interface MockUser {
  nationalId?: string
  scope?: string
}

// User factories
const createAdminUser = (): MockUser => ({
  nationalId: ADMIN_NATIONAL_ID,
  scope: '',
})

const createPublicWebUser = (): MockUser => ({
  nationalId: PUBLIC_WEB_NATIONAL_ID,
  scope: '@logbirtingablad.is/logbirtingabladid',
})

const createApplicationWebUser = (): MockUser => ({
  nationalId: APPLICATION_WEB_NATIONAL_ID,
  scope: '@logbirtingablad.is/lg-application-web',
})

const createRandomScopeUser = (): MockUser => ({
  nationalId: RANDOM_NATIONAL_ID,
  scope: '@dmr.is/other-scope',
})

// Helper to create a mock UserDto (admin users exist in DB)
const createMockUserDto = (nationalId: string): UserDto => ({
  id: 'user-123',
  nationalId,
  name: 'Admin User',
  email: 'admin@test.com',
  phone: '1234567',
})

describe('AdvertController - Guard Authorization', () => {
  let authorizationGuard: AuthorizationGuard
  let reflector: Reflector
  let usersService: jest.Mocked<IUsersService>

  // Helper to create mock ExecutionContext with REAL controller method reference
  const createMockContext = (
    user: MockUser | null,
    methodName: keyof AdvertController,
  ): ExecutionContext => {
    const mockRequest = { user }
    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
      // Use the ACTUAL controller method so Reflector reads real decorators
      getHandler: () =>
        AdvertController.prototype[methodName] as unknown as () => void,
      getClass: () => AdvertController,
    } as unknown as ExecutionContext
  }

  beforeEach(async () => {
    const mockUsersService = {
      getUserByNationalId: jest
        .fn()
        .mockImplementation((nationalId: string) => {
          // Only admin user exists in the database
          if (nationalId === ADMIN_NATIONAL_ID) {
            return Promise.resolve(createMockUserDto(nationalId))
          }
          // All other users throw error (not admins)
          throw new Error('User not found')
        }),
      getEmployees: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScopesGuard,
        AuthorizationGuard,
        Reflector, // Use REAL Reflector to read actual decorators
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

  // =============================================================================
  // Verify decorator configuration on controller class and methods
  // =============================================================================
  describe('Decorator configuration verification', () => {
    it('controller class should have @AdminAccess()', () => {
      const isAdminAccess = reflector.getAllAndOverride<boolean>(ADMIN_KEY, [
        AdvertController,
      ])
      expect(isAdminAccess).toBe(true)
    })

    it('getAdvertsCount should inherit @AdminAccess() from class', () => {
      const isAdminAccess = reflector.getAllAndOverride<boolean>(ADMIN_KEY, [
        AdvertController.prototype.getAdvertsCount,
        AdvertController,
      ])
      expect(isAdminAccess).toBe(true)
    })

    it('getAdverts should inherit @AdminAccess() from class', () => {
      const isAdminAccess = reflector.getAllAndOverride<boolean>(ADMIN_KEY, [
        AdvertController.prototype.getAdverts,
        AdvertController,
      ])
      expect(isAdminAccess).toBe(true)
    })

    it('getAdvertById should inherit @AdminAccess() from class', () => {
      const isAdminAccess = reflector.getAllAndOverride<boolean>(ADMIN_KEY, [
        AdvertController.prototype.getAdvertById,
        AdvertController,
      ])
      expect(isAdminAccess).toBe(true)
    })

    it('getAdvertByCaseId should have @ApplicationWebScopes()', () => {
      const scopes = reflector.getAllAndOverride<string[]>(SCOPES_KEY, [
        AdvertController.prototype.getAdvertByCaseId,
        AdvertController,
      ])
      expect(scopes).toEqual(['@logbirtingablad.is/lg-application-web'])
    })

    it('getAdvertByCaseId should also inherit @AdminAccess() from class', () => {
      const isAdminAccess = reflector.getAllAndOverride<boolean>(ADMIN_KEY, [
        AdvertController.prototype.getAdvertByCaseId,
        AdvertController,
      ])
      expect(isAdminAccess).toBe(true)
    })
  })

  // =============================================================================
  // getAdvertsCount - @AdminAccess() (inherited from class)
  // Expected: Only admin users can access
  // =============================================================================
  describe('getAdvertsCount - @AdminAccess() (class-level)', () => {
    describe('ScopesGuard', () => {
      it('should ALLOW access (no scope decorator on method)', async () => {
        const context = createMockContext(createAdminUser(), 'getAdvertsCount')
        const result = await authorizationGuard.canActivate(context)
        expect(result).toBe(true)
      })
    })

    describe('AdminGuard', () => {
      it('should ALLOW admin users', async () => {
        const context = createMockContext(createAdminUser(), 'getAdvertsCount')
        const result = await authorizationGuard.canActivate(context)
        expect(result).toBe(true)
        expect(usersService.getUserByNationalId).toHaveBeenCalledWith(
          ADMIN_NATIONAL_ID,
        )
      })

      it('should DENY public-web users (not in UserModel)', async () => {
        const context = createMockContext(
          createPublicWebUser(),
          'getAdvertsCount',
        )
        await expect(authorizationGuard.canActivate(context)).rejects.toThrow()
      })

      it('should DENY application-web users (not in UserModel)', async () => {
        const context = createMockContext(
          createApplicationWebUser(),
          'getAdvertsCount',
        )
        await expect(authorizationGuard.canActivate(context)).rejects.toThrow()
      })

      it('should DENY unauthenticated requests', async () => {
        const context = createMockContext(null, 'getAdvertsCount')
        await expect(authorizationGuard.canActivate(context)).rejects.toThrow()
      })
    })
  })

  // =============================================================================
  // getAdvertByCaseId - @AdminAccess() (class) + @ApplicationWebScopes() (method)
  // Expected: Admin users OR application-web users can access (OR logic)
  // =============================================================================
  describe('getAdvertByCaseId - @AdminAccess() + @ApplicationWebScopes()', () => {
    describe('ScopesGuard', () => {
      it('should ALLOW application-web users', async () => {
        const context = createMockContext(
          createApplicationWebUser(),
          'getAdvertByCaseId',
        )
        const result = await authorizationGuard.canActivate(context)
        expect(result).toBe(true)
      })

      it('should DENY public-web users (wrong scope)', async () => {
        const context = createMockContext(
          createPublicWebUser(),
          'getAdvertByCaseId',
        )
        await expect(authorizationGuard.canActivate(context)).rejects.toThrow()
      })

      it('should ALLOW admin users without scope', async () => {
        const context = createMockContext(
          createAdminUser(),
          'getAdvertByCaseId',
        )
        const result = await authorizationGuard.canActivate(context)
        expect(result).toBe(true)
      })
    })

    describe('AdminGuard (OR logic: admin OR scope)', () => {
      it('should ALLOW admin users (even without scope)', async () => {
        const context = createMockContext(
          createAdminUser(),
          'getAdvertByCaseId',
        )
        const result = await authorizationGuard.canActivate(context)
        expect(result).toBe(true)
      })

      it('should ALLOW application-web users via scope fallback', async () => {
        const context = createMockContext(
          createApplicationWebUser(),
          'getAdvertByCaseId',
        )
        const result = await authorizationGuard.canActivate(context)
        expect(result).toBe(true)
      })

      it('should DENY public-web users (not admin, wrong scope)', async () => {
        const context = createMockContext(
          createPublicWebUser(),
          'getAdvertByCaseId',
        )
        await expect(authorizationGuard.canActivate(context)).rejects.toThrow()
      })

      it('should DENY random scope users (not admin, wrong scope)', async () => {
        const context = createMockContext(
          createRandomScopeUser(),
          'getAdvertByCaseId',
        )
        await expect(authorizationGuard.canActivate(context)).rejects.toThrow()
      })
    })
  })

  // =============================================================================
  // Combined guard chain simulation
  // =============================================================================
  describe('Combined guard chain simulation', () => {
    /**
     * Simulates the guard chain: TokenJwtAuthGuard -> AdminGuard
     * Note: ScopesGuard was removed from AdvertController so AdminGuard handles
     * both admin check AND scope fallback with OR logic.
     */
    const simulateGuardChain = async (
      user: MockUser | null,
      methodName: keyof AdvertController,
    ): Promise<{ allowed: boolean; deniedBy?: string }> => {
      const context = createMockContext(user, methodName)

      // 1. TokenJwtAuthGuard - checks if user exists
      if (!user) {
        return { allowed: false, deniedBy: 'TokenJwtAuthGuard' }
      }

      // 2. AdminGuard - checks @AdminAccess decorator with scope fallback
      try {
        const adminResult = await authorizationGuard.canActivate(context)
        if (!adminResult) {
          return { allowed: false, deniedBy: 'AdminGuard' }
        }
      } catch {
        return { allowed: false, deniedBy: 'AdminGuard' }
      }

      return { allowed: true }
    }

    describe('getAdvertsCount (admin-only endpoint)', () => {
      it('admin user should pass', async () => {
        const result = await simulateGuardChain(
          createAdminUser(),
          'getAdvertsCount',
        )
        expect(result).toEqual({ allowed: true })
      })

      it('public-web user should be denied by AdminGuard', async () => {
        const result = await simulateGuardChain(
          createPublicWebUser(),
          'getAdvertsCount',
        )
        expect(result).toEqual({ allowed: false, deniedBy: 'AdminGuard' })
      })

      it('application-web user should be denied by AdminGuard', async () => {
        const result = await simulateGuardChain(
          createApplicationWebUser(),
          'getAdvertsCount',
        )
        expect(result).toEqual({ allowed: false, deniedBy: 'AdminGuard' })
      })

      it('unauthenticated should be denied by TokenJwtAuthGuard', async () => {
        const result = await simulateGuardChain(null, 'getAdvertsCount')
        expect(result).toEqual({
          allowed: false,
          deniedBy: 'TokenJwtAuthGuard',
        })
      })
    })

    describe('getAdvertByCaseId (admin OR application-web endpoint)', () => {
      it('admin user should pass via admin check', async () => {
        const result = await simulateGuardChain(
          createAdminUser(),
          'getAdvertByCaseId',
        )
        // AdminGuard handles OR logic: admin check passes
        expect(result).toEqual({ allowed: true })
      })

      it('application-web user should pass via scope fallback', async () => {
        const result = await simulateGuardChain(
          createApplicationWebUser(),
          'getAdvertByCaseId',
        )
        expect(result).toEqual({ allowed: true })
      })

      it('public-web user should be denied by AdminGuard (not admin, wrong scope)', async () => {
        const result = await simulateGuardChain(
          createPublicWebUser(),
          'getAdvertByCaseId',
        )
        expect(result).toEqual({ allowed: false, deniedBy: 'AdminGuard' })
      })

      it('unauthenticated should be denied by TokenJwtAuthGuard', async () => {
        const result = await simulateGuardChain(null, 'getAdvertByCaseId')
        expect(result).toEqual({
          allowed: false,
          deniedBy: 'TokenJwtAuthGuard',
        })
      })
    })
  })

  // =============================================================================
  // Verify AdminGuard OR logic works correctly
  // =============================================================================
  describe('AdminGuard OR logic verification', () => {
    /**
     * The AdvertController now uses:
     * @UseGuards(TokenJwtAuthGuard, AdminGuard)
     *
     * ScopesGuard was removed so AdminGuard handles both:
     * 1. Admin check (user exists in UserModel)
     * 2. Scope fallback (user has required scope)
     *
     * This enables OR logic: admin users OR users with correct scope can access.
     */
    it('should allow admin users on getAdvertByCaseId even without scope', async () => {
      const context = createMockContext(createAdminUser(), 'getAdvertByCaseId')

      // AdminGuard allows via admin check (no scope needed)
      const adminResult = await authorizationGuard.canActivate(context)
      expect(adminResult).toBe(true)
    })

    it('should allow application-web users on getAdvertByCaseId via scope fallback', async () => {
      const context = createMockContext(
        createApplicationWebUser(),
        'getAdvertByCaseId',
      )

      // AdminGuard allows via scope fallback (not admin, but has correct scope)
      const adminResult = await authorizationGuard.canActivate(context)
      expect(adminResult).toBe(true)
    })
  })
})

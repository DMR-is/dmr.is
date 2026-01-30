import { ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Test, TestingModule } from '@nestjs/testing'

import { SCOPES_KEY } from '@dmr.is/modules/guards/auth'

import { ADMIN_KEY } from '../../../core/decorators/admin.decorator'
import { AuthorizationGuard } from '../../../core/guards/authorization.guard'
import { UserDto } from '../../../models/users.model'
import { IUsersService } from '../../users/users.service.interface'
import { AdvertPublicationController } from './publication.controller'

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
  isActive: true,
})

describe('AdvertPublicationController - Guard Authorization', () => {
  let authorizationGuard: AuthorizationGuard
  let reflector: Reflector
  let usersService: jest.Mocked<IUsersService>

  // Helper to create mock ExecutionContext with REAL controller method reference
  const createMockContext = (
    user: MockUser | null,
    methodName: keyof AdvertPublicationController,
  ): ExecutionContext => {
    const mockRequest = { user }
    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
      // Use the ACTUAL controller method so Reflector reads real decorators
      getHandler: () =>
        AdvertPublicationController.prototype[
          methodName
        ] as unknown as () => void,
      getClass: () => AdvertPublicationController,
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
  // Verify decorator configuration on controller methods
  // =============================================================================
  describe('Decorator configuration verification', () => {
    it('getPublishedPublications should have @PublicWebScopes()', () => {
      const scopes = reflector.getAllAndOverride<string[]>(SCOPES_KEY, [
        AdvertPublicationController.prototype.getPublishedPublications,
        AdvertPublicationController,
      ])
      expect(scopes).toEqual(['@logbirtingablad.is/logbirtingabladid'])
    })

    it('getPublication should have @PublicOrApplicationWebScopes()', () => {
      const scopes = reflector.getAllAndOverride<string[]>(SCOPES_KEY, [
        AdvertPublicationController.prototype.getPublication,
        AdvertPublicationController,
      ])
      expect(scopes).toEqual([
        '@logbirtingablad.is/logbirtingabladid',
        '@logbirtingablad.is/lg-application-web',
      ])
    })

    it('getPublication should have @AdminAccess()', () => {
      const isAdminAccess = reflector.getAllAndOverride<boolean>(ADMIN_KEY, [
        AdvertPublicationController.prototype.getPublication,
        AdvertPublicationController,
      ])
      expect(isAdminAccess).toBe(true)
    })

    it('createAdvertPublication should have @AdminAccess()', () => {
      const isAdminAccess = reflector.getAllAndOverride<boolean>(ADMIN_KEY, [
        AdvertPublicationController.prototype.createAdvertPublication,
        AdvertPublicationController,
      ])
      expect(isAdminAccess).toBe(true)
    })

    it('createAdvertPublication should NOT have scope decorators', () => {
      const scopes = reflector.getAllAndOverride<string[]>(SCOPES_KEY, [
        AdvertPublicationController.prototype.createAdvertPublication,
        AdvertPublicationController,
      ])
      expect(scopes).toBeUndefined()
    })

    it('publishAdvertPublication should have @AdminAccess()', () => {
      const isAdminAccess = reflector.getAllAndOverride<boolean>(ADMIN_KEY, [
        AdvertPublicationController.prototype.publishAdvertPublication,
        AdvertPublicationController,
      ])
      expect(isAdminAccess).toBe(true)
    })

    it('updateAdvertPublication should have @AdminAccess()', () => {
      const isAdminAccess = reflector.getAllAndOverride<boolean>(ADMIN_KEY, [
        AdvertPublicationController.prototype.updateAdvertPublication,
        AdvertPublicationController,
      ])
      expect(isAdminAccess).toBe(true)
    })

    it('deleteAdvertPublication should have @AdminAccess()', () => {
      const isAdminAccess = reflector.getAllAndOverride<boolean>(ADMIN_KEY, [
        AdvertPublicationController.prototype.deleteAdvertPublication,
        AdvertPublicationController,
      ])
      expect(isAdminAccess).toBe(true)
    })
  })

  // =============================================================================
  // getPublication - @PublicOrApplicationWebScopes() + @AdminAccess()
  // Expected: Admin OR (Public-web OR Application-web) users can access (OR logic)
  // =============================================================================
  describe('getPublication - @PublicOrApplicationWebScopes() + @AdminAccess()', () => {
    it('should ALLOW admin users (via admin access)', async () => {
      const context = createMockContext(createAdminUser(), 'getPublication')
      const result = await authorizationGuard.canActivate(context)
      expect(result).toBe(true)
      expect(usersService.getUserByNationalId).toHaveBeenCalledWith(
        ADMIN_NATIONAL_ID,
        true,
      )
    })

    it('should ALLOW public-web users (via scope)', async () => {
      const context = createMockContext(createPublicWebUser(), 'getPublication')
      const result = await authorizationGuard.canActivate(context)
      expect(result).toBe(true)
      // Admin check should not be done for scoped users
      expect(usersService.getUserByNationalId).not.toHaveBeenCalled()
    })

    it('should ALLOW application-web users (via scope)', async () => {
      const context = createMockContext(
        createApplicationWebUser(),
        'getPublication',
      )
      const result = await authorizationGuard.canActivate(context)
      expect(result).toBe(true)
      // Admin check should not be done for scoped users
      expect(usersService.getUserByNationalId).not.toHaveBeenCalled()
    })

    it('should DENY users with random/invalid scope (not admin, not valid scope)', async () => {
      const context = createMockContext(
        createRandomScopeUser(),
        'getPublication',
      )
      await expect(authorizationGuard.canActivate(context)).rejects.toThrow()
      expect(usersService.getUserByNationalId).toHaveBeenCalledWith(
        RANDOM_NATIONAL_ID,
        true,
      )
    })

    it('should DENY unauthenticated requests', async () => {
      const context = createMockContext(null, 'getPublication')
      await expect(authorizationGuard.canActivate(context)).rejects.toThrow()
    })
  })

  // =============================================================================
  // getPublishedPublications - @PublicWebScopes() (no @AdminAccess)
  // Expected: Only public-web users can access
  // =============================================================================
  describe('getPublishedPublications - @PublicWebScopes()', () => {
    describe('ScopesGuard', () => {
      it('should ALLOW public-web users', async () => {
        const context = createMockContext(
          createPublicWebUser(),
          'getPublishedPublications',
        )
        const result = await authorizationGuard.canActivate(context)
        expect(result).toBe(true)
      })

      it('should DENY application-web users', async () => {
        const context = createMockContext(
          createApplicationWebUser(),
          'getPublishedPublications',
        )
        const result = await authorizationGuard.canActivate(context)
        expect(result).toBe(false)
      })

      it('should DENY admin users without scope', async () => {
        const context = createMockContext(
          createAdminUser(),
          'getPublishedPublications',
        )
        const result = await authorizationGuard.canActivate(context)
        expect(result).toBe(false)
      })
    })
  })

  // =============================================================================
  // createAdvertPublication - @AdminAccess() (no scope decorator)
  // Expected: Only admin users can access
  // =============================================================================
  describe('createAdvertPublication - @AdminAccess()', () => {
    describe('ScopesGuard', () => {
      it('should ALLOW access (no scope decorator)', async () => {
        const context = createMockContext(
          createAdminUser(),
          'createAdvertPublication',
        )
        const result = await authorizationGuard.canActivate(context)
        expect(result).toBe(true)
      })
    })

    describe('AdminGuard', () => {
      it('should ALLOW admin users', async () => {
        const context = createMockContext(
          createAdminUser(),
          'createAdvertPublication',
        )
        const result = await authorizationGuard.canActivate(context)
        expect(result).toBe(true)
        expect(usersService.getUserByNationalId).toHaveBeenCalledWith(
          ADMIN_NATIONAL_ID,
          true,
        )
      })

      it('should DENY public-web users (not in UserModel)', async () => {
        const context = createMockContext(
          createPublicWebUser(),
          'createAdvertPublication',
        )
        await expect(authorizationGuard.canActivate(context)).rejects.toThrow()
      })

      it('should DENY application-web users (not in UserModel)', async () => {
        const context = createMockContext(
          createApplicationWebUser(),
          'createAdvertPublication',
        )
        await expect(authorizationGuard.canActivate(context)).rejects.toThrow()
      })

      it('should DENY unauthenticated requests', async () => {
        const context = createMockContext(null, 'createAdvertPublication')
        await expect(authorizationGuard.canActivate(context)).rejects.toThrow()
      })
    })
  })

  // =============================================================================
  // Combined guard chain tests - simulating actual request flow
  // =============================================================================
  describe('Combined guard chain simulation', () => {
    /**
     * Simulates the guard chain: TokenJwtAuthGuard -> ScopesGuard -> AdminGuard
     */
    const simulateGuardChain = async (
      user: MockUser | null,
      methodName: keyof AdvertPublicationController,
    ): Promise<{ allowed: boolean; deniedBy?: string }> => {
      const context = createMockContext(user, methodName)

      // 1. TokenJwtAuthGuard - checks if user exists
      if (!user) {
        return { allowed: false, deniedBy: 'TokenJwtAuthGuard' }
      }

      // 2. ScopesGuard - checks scope decorators
      const scopesResult = await authorizationGuard.canActivate(context)
      if (!scopesResult) {
        return { allowed: false, deniedBy: 'ScopesGuard' }
      }

      // 3. AdminGuard - checks @AdminAccess decorator
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

    describe('getPublication (admin OR scope endpoint)', () => {
      it('public-web user should pass (via scope)', async () => {
        const result = await simulateGuardChain(
          createPublicWebUser(),
          'getPublication',
        )
        expect(result).toEqual({ allowed: true })
      })

      it('application-web user should pass (via scope)', async () => {
        const result = await simulateGuardChain(
          createApplicationWebUser(),
          'getPublication',
        )
        expect(result).toEqual({ allowed: true })
      })

      it('admin user should pass (via admin access)', async () => {
        const result = await simulateGuardChain(
          createAdminUser(),
          'getPublication',
        )
        expect(result).toEqual({ allowed: true })
      })

      it('user with invalid scope should be denied by AdminGuard', async () => {
        await expect(
          simulateGuardChain(createRandomScopeUser(), 'getPublication'),
        ).rejects.toThrow()
      })
    })

    describe('createAdvertPublication (admin-only endpoint)', () => {
      it('admin user should pass', async () => {
        const result = await simulateGuardChain(
          createAdminUser(),
          'createAdvertPublication',
        )
        expect(result).toEqual({ allowed: true })
      })

      it('public-web user should be denied by AdminGuard', async () => {
        await expect(
          simulateGuardChain(createPublicWebUser(), 'createAdvertPublication'),
        ).rejects.toThrow()
      })

      it('application-web user should be denied by AdminGuard', async () => {
        await expect(
          simulateGuardChain(
            createApplicationWebUser(),
            'createAdvertPublication',
          ),
        ).rejects.toThrow()
      })

      it('unauthenticated should be denied by TokenJwtAuthGuard', async () => {
        const result = await simulateGuardChain(null, 'createAdvertPublication')
        expect(result).toEqual({
          allowed: false,
          deniedBy: 'TokenJwtAuthGuard',
        })
      })
    })
  })
})

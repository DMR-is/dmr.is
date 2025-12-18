import { ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Test, TestingModule } from '@nestjs/testing'

import { ACTOR_SCOPES_KEY, SCOPES_KEY } from './scopes.decorator'
import { ScopesGuard } from './scopes-guard'

interface MockUser {
  scope?: string
  actor?: {
    scope?: string
  }
}

describe('ScopesGuard', () => {
  let guard: ScopesGuard
  let reflector: Reflector

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScopesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile()

    guard = module.get<ScopesGuard>(ScopesGuard)
    reflector = module.get<Reflector>(Reflector)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('when no scope decorators are present', () => {
    beforeEach(() => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined)
    })

    it('should allow access', () => {
      const context = createMockContext()

      const result = guard.canActivate(context)

      expect(result).toBe(true)
    })

    it('should allow access even without user in request', () => {
      const context = createMockContext(null)

      const result = guard.canActivate(context)

      expect(result).toBe(true)
    })
  })

  describe('when @Scopes() decorator is present', () => {
    const requiredScopes = ['@logbirtingablad.is/logbirtingabladid']

    beforeEach(() => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === SCOPES_KEY) return requiredScopes
        if (key === ACTOR_SCOPES_KEY) return undefined
        return undefined
      })
    })

    describe('and user has matching scope', () => {
      it('should allow access with exact scope match', () => {
        const context = createMockContext({
          scope: '@logbirtingablad.is/logbirtingabladid',
        })

        const result = guard.canActivate(context)

        expect(result).toBe(true)
      })

      it('should allow access when user has multiple scopes including required one', () => {
        const context = createMockContext({
          scope: '@dmr.is/other-scope @logbirtingablad.is/logbirtingabladid @dmr.is/another',
        })

        const result = guard.canActivate(context)

        expect(result).toBe(true)
      })
    })

    describe('and user does NOT have matching scope', () => {
      it('should deny access when scope does not match', () => {
        const context = createMockContext({
          scope: '@logbirtingablad.is/lg-application-web',
        })

        const result = guard.canActivate(context)

        expect(result).toBe(false)
      })

      it('should deny access when user has no scopes', () => {
        const context = createMockContext({
          scope: '',
        })

        const result = guard.canActivate(context)

        expect(result).toBe(false)
      })

      it('should deny access when user scope is undefined', () => {
        const context = createMockContext({})

        const result = guard.canActivate(context)

        expect(result).toBe(false)
      })

      it('should deny access when user is null', () => {
        const context = createMockContext(null)

        const result = guard.canActivate(context)

        expect(result).toBe(false)
      })
    })
  })

  describe('when multiple scopes are required (OR logic)', () => {
    const requiredScopes = [
      '@logbirtingablad.is/logbirtingabladid',
      '@logbirtingablad.is/lg-application-web',
    ]

    beforeEach(() => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === SCOPES_KEY) return requiredScopes
        if (key === ACTOR_SCOPES_KEY) return undefined
        return undefined
      })
    })

    it('should allow access when user has first scope', () => {
      const context = createMockContext({
        scope: '@logbirtingablad.is/logbirtingabladid',
      })

      const result = guard.canActivate(context)

      expect(result).toBe(true)
    })

    it('should allow access when user has second scope', () => {
      const context = createMockContext({
        scope: '@logbirtingablad.is/lg-application-web',
      })

      const result = guard.canActivate(context)

      expect(result).toBe(true)
    })

    it('should allow access when user has both scopes', () => {
      const context = createMockContext({
        scope: '@logbirtingablad.is/logbirtingabladid @logbirtingablad.is/lg-application-web',
      })

      const result = guard.canActivate(context)

      expect(result).toBe(true)
    })

    it('should deny access when user has neither scope', () => {
      const context = createMockContext({
        scope: '@dmr.is/other-scope',
      })

      const result = guard.canActivate(context)

      expect(result).toBe(false)
    })
  })

  describe('when @ActorScopes() decorator is present', () => {
    const requiredActorScopes = ['@dmr.is/actor-scope']

    beforeEach(() => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === SCOPES_KEY) return undefined
        if (key === ACTOR_SCOPES_KEY) return requiredActorScopes
        return undefined
      })
    })

    describe('and user has actor with matching scope', () => {
      it('should allow access when actor has required scope', () => {
        const context = createMockContext({
          actor: {
            scope: '@dmr.is/actor-scope',
          },
        })

        const result = guard.canActivate(context)

        expect(result).toBe(true)
      })

      it('should allow access when actor has multiple scopes including required one', () => {
        const context = createMockContext({
          actor: {
            scope: '@dmr.is/other @dmr.is/actor-scope @dmr.is/another',
          },
        })

        const result = guard.canActivate(context)

        expect(result).toBe(true)
      })
    })

    describe('and user does NOT have actor with matching scope', () => {
      it('should deny access when actor scope does not match', () => {
        const context = createMockContext({
          actor: {
            scope: '@dmr.is/other-scope',
          },
        })

        const result = guard.canActivate(context)

        expect(result).toBe(false)
      })

      it('should fall back to user scope when no actor', () => {
        const context = createMockContext({
          scope: '@dmr.is/actor-scope', // User has the scope, no actor
        })

        const result = guard.canActivate(context)

        expect(result).toBe(true)
      })

      it('should deny access when no actor and user scope does not match', () => {
        const context = createMockContext({
          scope: '@dmr.is/other-scope',
        })

        const result = guard.canActivate(context)

        expect(result).toBe(false)
      })
    })
  })

  describe('when both @Scopes() and @ActorScopes() are present', () => {
    const requiredScopes = ['@logbirtingablad.is/logbirtingabladid']
    const requiredActorScopes = ['@dmr.is/actor-scope']

    beforeEach(() => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === SCOPES_KEY) return requiredScopes
        if (key === ACTOR_SCOPES_KEY) return requiredActorScopes
        return undefined
      })
    })

    it('should allow access when both scope and actor scope match', () => {
      const context = createMockContext({
        scope: '@logbirtingablad.is/logbirtingabladid',
        actor: {
          scope: '@dmr.is/actor-scope',
        },
      })

      const result = guard.canActivate(context)

      expect(result).toBe(true)
    })

    it('should deny access when scope matches but actor scope does not', () => {
      const context = createMockContext({
        scope: '@logbirtingablad.is/logbirtingabladid',
        actor: {
          scope: '@dmr.is/other-scope',
        },
      })

      const result = guard.canActivate(context)

      expect(result).toBe(false)
    })

    it('should deny access when actor scope matches but scope does not', () => {
      const context = createMockContext({
        scope: '@dmr.is/other-scope',
        actor: {
          scope: '@dmr.is/actor-scope',
        },
      })

      const result = guard.canActivate(context)

      expect(result).toBe(false)
    })

    it('should deny access when neither scope matches', () => {
      const context = createMockContext({
        scope: '@dmr.is/wrong-scope',
        actor: {
          scope: '@dmr.is/other-scope',
        },
      })

      const result = guard.canActivate(context)

      expect(result).toBe(false)
    })
  })

  describe('scope parsing edge cases', () => {
    const requiredScopes = ['@logbirtingablad.is/logbirtingabladid']

    beforeEach(() => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === SCOPES_KEY) return requiredScopes
        if (key === ACTOR_SCOPES_KEY) return undefined
        return undefined
      })
    })

    it('should handle scopes as space-separated string', () => {
      const context = createMockContext({
        scope: 'scope1 @logbirtingablad.is/logbirtingabladid scope3',
      })

      const result = guard.canActivate(context)

      expect(result).toBe(true)
    })

    it('should NOT match partial scope names', () => {
      const context = createMockContext({
        scope: '@logbirtingablad.is/logbirtingabladid-extended',
      })

      const result = guard.canActivate(context)

      expect(result).toBe(false)
    })

    it('should NOT match scope prefix', () => {
      const context = createMockContext({
        scope: '@dmr.is/lg-public',
      })

      const result = guard.canActivate(context)

      expect(result).toBe(false)
    })
  })

  describe('Legal Gazette specific scope decorators', () => {
    describe('@PublicWebScopes() - requires @logbirtingablad.is/logbirtingabladid', () => {
      beforeEach(() => {
        jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
          if (key === SCOPES_KEY) return ['@logbirtingablad.is/logbirtingabladid']
          return undefined
        })
      })

      it('should allow public-web users', () => {
        const context = createMockContext({
          scope: '@logbirtingablad.is/logbirtingabladid',
        })

        expect(guard.canActivate(context)).toBe(true)
      })

      it('should deny application-web users', () => {
        const context = createMockContext({
          scope: '@logbirtingablad.is/lg-application-web',
        })

        expect(guard.canActivate(context)).toBe(false)
      })
    })

    describe('@ApplicationWebScopes() - requires @logbirtingablad.is/lg-application-web', () => {
      beforeEach(() => {
        jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
          if (key === SCOPES_KEY) return ['@logbirtingablad.is/lg-application-web']
          return undefined
        })
      })

      it('should allow application-web users', () => {
        const context = createMockContext({
          scope: '@logbirtingablad.is/lg-application-web',
        })

        expect(guard.canActivate(context)).toBe(true)
      })

      it('should deny public-web users', () => {
        const context = createMockContext({
          scope: '@logbirtingablad.is/logbirtingabladid',
        })

        expect(guard.canActivate(context)).toBe(false)
      })
    })

    describe('@PublicOrApplicationWebScopes() - requires either scope', () => {
      beforeEach(() => {
        jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
          if (key === SCOPES_KEY)
            return ['@logbirtingablad.is/logbirtingabladid', '@logbirtingablad.is/lg-application-web']
          return undefined
        })
      })

      it('should allow public-web users', () => {
        const context = createMockContext({
          scope: '@logbirtingablad.is/logbirtingabladid',
        })

        expect(guard.canActivate(context)).toBe(true)
      })

      it('should allow application-web users', () => {
        const context = createMockContext({
          scope: '@logbirtingablad.is/lg-application-web',
        })

        expect(guard.canActivate(context)).toBe(true)
      })

      it('should deny users with other scopes', () => {
        const context = createMockContext({
          scope: '@dmr.is/other-scope',
        })

        expect(guard.canActivate(context)).toBe(false)
      })
    })
  })
})

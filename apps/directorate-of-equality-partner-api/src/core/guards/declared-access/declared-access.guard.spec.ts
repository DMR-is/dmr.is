import { ForbiddenException } from '@nestjs/common'
import { APP_GUARD, Reflector } from '@nestjs/core'

import { AppModule } from '../../../app/app.module'
import { PUBLIC_ROUTE_METADATA } from '../../decorators/public-route.decorator'
import { RequireActiveCompanyGuard } from '../active-company/require-active-company.guard'
import { ApiKeyGuard } from '../api-key/api-key.guard'
import { RequireApiScopeGuard } from '../api-key-scope/require-api-scope.guard'
import { PartnerCompanyGuard } from '../partner-company/partner-company.guard'
import { DeclaredAccessGuard } from './declared-access.guard'

const GUARDS_METADATA = '__guards__'

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

/**
 * A context whose handler and class carry the given guard chains, which is what
 * the guard reads — it does not ask Nest, it reads the metadata directly.
 */
const contextWith = (
  classGuards: unknown[] = [],
  handlerGuards: unknown[] = [],
  publicReason?: string,
) => {
  class Controller {}
  const handler = function named() {
    return undefined
  }
  Reflect.defineMetadata(GUARDS_METADATA, classGuards, Controller)
  Reflect.defineMetadata(GUARDS_METADATA, handlerGuards, handler)
  if (publicReason) {
    Reflect.defineMetadata(PUBLIC_ROUTE_METADATA, publicReason, handler)
  }

  return {
    switchToHttp: () => ({ getRequest: () => ({}) }),
    getHandler: () => handler,
    getClass: () => Controller,
  } as never
}

const guard = () =>
  new DeclaredAccessGuard(mockLogger as never, new Reflector())

const FULL_CHAIN = [
  ApiKeyGuard,
  PartnerCompanyGuard,
  RequireApiScopeGuard,
  RequireActiveCompanyGuard,
]

describe('DeclaredAccessGuard', () => {
  beforeEach(() => jest.clearAllMocks())

  it('is registered as an APP_GUARD, so it runs on every route', () => {
    // Pinned because the whole default-deny property rests on this one entry.
    // Everything else in this file tests a guard nothing would invoke if the
    // registration were dropped.
    const providers = Reflect.getMetadata('providers', AppModule) as Array<{
      provide?: unknown
      useClass?: unknown
    }>

    expect(
      providers.some(
        (p) => p?.provide === APP_GUARD && p?.useClass === DeclaredAccessGuard,
      ),
    ).toBe(true)
  })

  it('allows a fully declared chain', () => {
    expect(guard().canActivate(contextWith(FULL_CHAIN))).toBe(true)
  })

  it('allows a chain assembled across class and handler', () => {
    // Nest unions the two rather than overriding, so the guard must too.
    expect(
      guard().canActivate(
        contextWith(
          [ApiKeyGuard, PartnerCompanyGuard],
          [RequireApiScopeGuard, RequireActiveCompanyGuard],
        ),
      ),
    ).toBe(true)
  })

  it('allows an explicitly public route with no guards at all', () => {
    expect(guard().canActivate(contextWith([], [], 'liveness probe'))).toBe(
      true,
    )
  })

  describe('refuses', () => {
    const cases: Array<[string, unknown[]]> = [
      ['no guards at all', []],
      ['authentication only', [ApiKeyGuard]],
      [
        'authentication without scope enforcement',
        [ApiKeyGuard, PartnerCompanyGuard],
      ],
      [
        'identity without authentication',
        [PartnerCompanyGuard, RequireApiScopeGuard],
      ],
      ['scope enforcement alone', [RequireApiScopeGuard]],
      // Added for the reason the scope case exists: the decorator was declared
      // on the controller while its own spec mocked the reflector for every
      // case, so nothing observed the real chain and the guard could be deleted
      // from `@UseGuards` with every test still green.
      [
        'everything but the register check',
        [ApiKeyGuard, PartnerCompanyGuard, RequireApiScopeGuard],
      ],
    ]

    for (const [label, chain] of cases) {
      it(label, () => {
        expect(() => guard().canActivate(contextWith(chain))).toThrow(
          ForbiddenException,
        )
      })
    }

    it('logs what is missing without returning it', () => {
      // The response must not publish the guard architecture of a public
      // surface; the fix has to reach whoever runs the app instead.
      try {
        guard().canActivate(contextWith([]))
      } catch (error) {
        expect(
          JSON.stringify((error as ForbiddenException).getResponse()),
        ).not.toContain('UseGuards')
      }

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('declares no access policy'),
        expect.anything(),
      )
    })
  })
})

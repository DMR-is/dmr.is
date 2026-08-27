import {
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { ApiKeyScopeEnum } from '@dmr.is/doe-shared'

import { RequireApiScopeGuard } from './require-api-scope.guard'

const contextFor = (request: Record<string, unknown>) =>
  ({
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => () => undefined,
    getClass: () => class {},
  }) as never

const withRequiredScope = (scope?: ApiKeyScopeEnum) => {
  const reflector = new Reflector()
  jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(scope)
  return new RequireApiScopeGuard(reflector)
}

const keyWithScopes = (...scopes: ApiKeyScopeEnum[]) => ({
  apiKeyContext: { keyId: 'k', scopes },
})

describe('RequireApiScopeGuard', () => {
  it('allows a handler that declares no scope', () => {
    const guard = withRequiredScope(undefined)

    expect(guard.canActivate(contextFor(keyWithScopes()))).toBe(true)
  })

  it('allows a key holding the required scope', () => {
    const guard = withRequiredScope(ApiKeyScopeEnum.SALARY_SUBMIT)

    expect(
      guard.canActivate(
        contextFor(keyWithScopes(ApiKeyScopeEnum.SALARY_SUBMIT)),
      ),
    ).toBe(true)
  })

  it('forbids a key narrowed to a different scope', () => {
    const guard = withRequiredScope(ApiKeyScopeEnum.SALARY_SUBMIT)

    expect(() =>
      guard.canActivate(
        contextFor(keyWithScopes(ApiKeyScopeEnum.REPORT_READ)),
      ),
    ).toThrow(ForbiddenException)
  })

  it('names the missing scope, since that is actionable for an integrator', () => {
    const guard = withRequiredScope(ApiKeyScopeEnum.EQUALITY_SUBMIT)

    expect(() =>
      guard.canActivate(
        contextFor(keyWithScopes(ApiKeyScopeEnum.REPORT_READ)),
      ),
    ).toThrow(/equality:submit/)
  })

  it('is a server error, not a 403, when ApiKeyGuard did not run', () => {
    // A 403 here would read as "your key lacks the scope" and send an
    // integrator chasing a key that is perfectly fine. It is our wiring bug.
    const guard = withRequiredScope(ApiKeyScopeEnum.SALARY_SUBMIT)

    expect(() => guard.canActivate(contextFor({}))).toThrow(
      InternalServerErrorException,
    )
  })
})

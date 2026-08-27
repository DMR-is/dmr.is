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

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

const withRequiredScope = (scope?: ApiKeyScopeEnum) => {
  const reflector = new Reflector()
  jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(scope)
  return new RequireApiScopeGuard(mockLogger as never, reflector)
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

  describe('when ApiKeyGuard did not run', () => {
    it('is a server error, not a 403', () => {
      // A 403 would read as "your key lacks the scope" and send an integrator
      // chasing a key that is perfectly fine. It is our wiring bug.
      const guard = withRequiredScope(ApiKeyScopeEnum.SALARY_SUBMIT)

      expect(() => guard.canActivate(contextFor({}))).toThrow(
        InternalServerErrorException,
      )
    })

    it('does not put the wiring detail where a client can read it', () => {
      // HttpExceptionFilter genericises `message` but copies the exception's
      // own message into `details`, which IS returned. So the guard must throw
      // WITHOUT a message and log the detail instead.
      const guard = withRequiredScope(ApiKeyScopeEnum.SALARY_SUBMIT)

      try {
        guard.canActivate(contextFor({}))
        throw new Error('expected the guard to throw')
      } catch (error) {
        const response = (error as InternalServerErrorException).getResponse()
        expect(JSON.stringify(response)).not.toContain('UseGuards')
        expect(JSON.stringify(response)).not.toContain('ApiKeyGuard')
      }
    })

    it('logs the wiring detail, so it still reaches whoever runs the app', () => {
      const guard = withRequiredScope(ApiKeyScopeEnum.SALARY_SUBMIT)

      expect(() => guard.canActivate(contextFor({}))).toThrow()
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('fix the @UseGuards order'),
        expect.anything(),
      )
    })
  })
})

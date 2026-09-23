import {
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common'

import { ApiKeyKindEnum } from '@dmr.is/doe-shared'

import { PartnerClientGuard } from './partner-client.guard'

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

const contextFor = (apiKeyContext: unknown) =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ headers: {}, apiKeyContext }),
    }),
  }) as never

describe('PartnerClientGuard', () => {
  const guard = new PartnerClientGuard(logger as never)

  it('marks a vendor key’s scopes as resolved for a firm-only route', () => {
    const request = {
      headers: {},
      apiKeyContext: {
        kind: ApiKeyKindEnum.PARTNER_CLIENT,
        scopesResolved: false,
      },
    }
    guard.canActivate({
      switchToHttp: () => ({ getRequest: () => request }),
    } as never)

    expect(request.apiKeyContext).toMatchObject({ scopesResolved: true })
  })

  it('admits a vendor client key', () => {
    expect(
      guard.canActivate(contextFor({ kind: ApiKeyKindEnum.PARTNER_CLIENT })),
    ).toBe(true)
  })

  it('refuses a company key rather than showing it an empty list', () => {
    expect(() =>
      guard.canActivate(contextFor({ kind: ApiKeyKindEnum.COMPANY })),
    ).toThrow(ForbiddenException)
  })

  it('refuses to run without ApiKeyGuard before it', () => {
    expect(() => guard.canActivate(contextFor(undefined))).toThrow(
      InternalServerErrorException,
    )
  })
})

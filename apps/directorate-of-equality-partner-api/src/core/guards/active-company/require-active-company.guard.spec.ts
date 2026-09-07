import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { CompanyStatusEnum } from '@dmr.is/doe-modules/company'

import { RequireActiveCompanyGuard } from './require-active-company.guard'

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

const guardFor = (required?: boolean) => {
  const reflector = new Reflector()
  jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(required)
  return new RequireActiveCompanyGuard(mockLogger as never, reflector)
}

const companyWithStatus = (status: CompanyStatusEnum) => ({
  companyContext: { id: 'company-1', status },
})

describe('RequireActiveCompanyGuard', () => {
  beforeEach(() => jest.clearAllMocks())

  it('is inert on a route that declares nothing', () => {
    // `PartnerController` declares it once for every route, so nothing is
    // exempt today. The inert path is what keeps the guard opt-in: a future
    // route that should stay reachable declares nothing rather than needing the
    // guard removed from a chain it shares.
    const guard = guardFor(undefined)

    expect(
      guard.canActivate(
        contextFor(companyWithStatus(CompanyStatusEnum.INACTIVE)),
      ),
    ).toBe(true)
  })

  it('allows a call for an active company', () => {
    const guard = guardFor(true)

    expect(
      guard.canActivate(contextFor(companyWithStatus(CompanyStatusEnum.ACTIVE))),
    ).toBe(true)
  })

  it('refuses a call for an inactive company with a 409', () => {
    // 409 rather than 403: the registration can be reinstated, and a 403 would
    // be indistinguishable from the scope refusal one guard earlier.
    const guard = guardFor(true)

    expect(() =>
      guard.canActivate(
        contextFor(companyWithStatus(CompanyStatusEnum.INACTIVE)),
      ),
    ).toThrow(ConflictException)
  })

  it('explains itself without naming an internal identifier', () => {
    // The message is the ENTIRE diagnosis: `PartnerCompanyDto` does not carry
    // the register status, so a vendor cannot read the flag and work out why it
    // was refused. It still must not leak our ids.
    const guard = guardFor(true)

    try {
      guard.canActivate(
        contextFor(companyWithStatus(CompanyStatusEnum.INACTIVE)),
      )
      throw new Error('expected the guard to refuse')
    } catch (error) {
      const message = (error as ConflictException).message

      expect(message).toContain('not active in the register')
      expect(message).toContain('Jafnréttisstofa')
      expect(message).not.toContain('company-1')
    }
  })

  it('logs the company it refused, so support can find it', () => {
    const guard = guardFor(true)

    expect(() =>
      guard.canActivate(
        contextFor(companyWithStatus(CompanyStatusEnum.INACTIVE)),
      ),
    ).toThrow(ConflictException)
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('inactive company'),
      expect.objectContaining({ companyId: 'company-1' }),
    )
  })

  it('is a wiring fault, not a refusal, when the company was never resolved', () => {
    // Running without PartnerCompanyGuard must not read as "your company is
    // inactive" — that would send an integrator chasing a registration that is
    // fine.
    const guard = guardFor(true)

    expect(() => guard.canActivate(contextFor({}))).toThrow(
      InternalServerErrorException,
    )
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('fix the @UseGuards order'),
      expect.anything(),
    )
  })
})

import {
  CanActivate,
  ForbiddenException,
  Injectable,
  UseGuards,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { PublicRoute } from '../../decorators/public-route.decorator'
import { AdminGuard } from '../admin/admin.guard'
import { CompanyResourceGuard } from '../company-resource/company-resource.guard'
import { ReportResourceGuard } from '../report-resource/report-resource.guard'
import { DeclaredAccessGuard, declaresAccess } from './declared-access.guard'

@Injectable()
class UnrelatedGuard implements CanActivate {
  canActivate(): boolean {
    return true
  }
}

// Fixtures carry real decorators and are read through a real Reflector: a mocked
// reflector would prove nothing about how Nest actually stores this metadata,
// and the class/handler union below is the whole behaviour under test.

@UseGuards(TokenJwtAuthGuard, AdminGuard)
class StaffController {
  handler() {
    return null
  }
}

@UseGuards(TokenJwtAuthGuard, CompanyResourceGuard)
class ApplicantController {
  handler() {
    return null
  }
}

@UseGuards(TokenJwtAuthGuard, AdminGuard, ReportResourceGuard)
class ReportScopedController {
  handler() {
    return null
  }
}

@UseGuards(TokenJwtAuthGuard)
class AuthenticatedOnlyController {
  handler() {
    return null
  }
}

@UseGuards(TokenJwtAuthGuard, UnrelatedGuard)
class UnrelatedGuardController {
  handler() {
    return null
  }
}

@UseGuards(AdminGuard)
class UnauthenticatedIdentityController {
  handler() {
    return null
  }
}

class UndeclaredController {
  handler() {
    return null
  }
}

@PublicRoute('liveness probe — no caller identity')
class PublicController {
  handler() {
    return null
  }
}

class PartiallyPublicController {
  @PublicRoute('deliberately open')
  open() {
    return null
  }

  closed() {
    return null
  }
}

@UseGuards(TokenJwtAuthGuard)
class HandlerCompletedController {
  @UseGuards(CompanyResourceGuard)
  handler() {
    return null
  }
}

const contextFor = (
  // eslint-disable-next-line @typescript-eslint/ban-types
  controller: Function,
  method = 'handler',
) =>
  ({
    getHandler: () => controller.prototype[method],
    getClass: () => controller,
  }) as never

describe('DeclaredAccessGuard', () => {
  const logger = { error: jest.fn(), warn: jest.fn(), info: jest.fn() }

  let guard: DeclaredAccessGuard

  beforeEach(() => {
    jest.clearAllMocks()
    guard = new DeclaredAccessGuard(logger as never, new Reflector())
  })

  it.each([
    ['a DoE staff chain', StaffController],
    ['an applicant chain', ApplicantController],
    ['a report-scoped chain', ReportScopedController],
  ])('allows %s', (_label, controller) => {
    expect(guard.canActivate(contextFor(controller))).toBe(true)
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('refuses a controller that declares nothing', () => {
    expect(() => guard.canActivate(contextFor(UndeclaredController))).toThrow(
      ForbiddenException,
    )
  })

  // The gap this guard exists to close: a verified island.is token proves the
  // caller is *someone*, not that they are a DoE user or a registered company.
  // Without an identity guard the route is open to any authenticated citizen.
  it('refuses a chain that authenticates but never resolves the caller', () => {
    expect(() =>
      guard.canActivate(contextFor(AuthenticatedOnlyController)),
    ).toThrow(ForbiddenException)
  })

  it('refuses a second guard that is not an identity guard', () => {
    expect(() =>
      guard.canActivate(contextFor(UnrelatedGuardController)),
    ).toThrow(ForbiddenException)
  })

  it('refuses an identity guard with no authentication in front of it', () => {
    expect(() =>
      guard.canActivate(contextFor(UnauthenticatedIdentityController)),
    ).toThrow(ForbiddenException)
  })

  it('logs the controller, handler and the fix when refusing', () => {
    expect(() => guard.canActivate(contextFor(UndeclaredController))).toThrow()

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('@PublicRoute'),
      expect.objectContaining({
        controller: 'UndeclaredController',
        handler: 'handler',
      }),
    )
  })

  it('does not leak the fix into the response body', () => {
    expect(() => guard.canActivate(contextFor(UndeclaredController))).toThrow(
      'This endpoint declares no access policy',
    )
  })

  it('allows a @PublicRoute controller with no guards at all', () => {
    expect(guard.canActivate(contextFor(PublicController))).toBe(true)
  })

  it('applies @PublicRoute per handler without opening its siblings', () => {
    expect(
      guard.canActivate(contextFor(PartiallyPublicController, 'open')),
    ).toBe(true)
    expect(() =>
      guard.canActivate(contextFor(PartiallyPublicController, 'closed')),
    ).toThrow(ForbiddenException)
  })

  // Handler-level @UseGuards adds to the class chain rather than replacing it,
  // so the union has to be read. getAllAndOverride would drop the class guards.
  it('unions handler guards with class guards', () => {
    expect(guard.canActivate(contextFor(HandlerCompletedController))).toBe(true)
  })

  describe('declaresAccess', () => {
    it('accepts guard instances, not just classes', () => {
      const declared = declaresAccess([
        Object.create(TokenJwtAuthGuard.prototype),
        Object.create(AdminGuard.prototype),
      ])

      expect(declared).toBe(true)
    })

    it('rejects an empty chain', () => {
      expect(declaresAccess([])).toBe(false)
    })

    it('ignores entries that are neither classes nor instances', () => {
      expect(declaresAccess([null, undefined, 'AdminGuard', 42])).toBe(false)
    })
  })
})

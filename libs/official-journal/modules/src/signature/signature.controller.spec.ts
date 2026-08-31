import { ROLES_KEY, UserRoleEnum } from '@dmr.is/constants'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { RoleGuard } from '../guards/auth'
import { SignatureController } from './signature.controller'

/**
 * Nine routes, six of them mutating, previously reachable unauthenticated on
 * an internet-facing ALB. Guarded at class level, so the assertions read the
 * class metadata.
 */
describe('SignatureController guards', () => {
  const guards = (Reflect.getMetadata('__guards__', SignatureController) ??
    []) as Array<unknown>

  it('verifies the bearer token', () => {
    expect(guards).toContain(TokenJwtAuthGuard)
  })

  it('restricts every route to Admin', () => {
    expect(guards).toContain(RoleGuard)
    expect(Reflect.getMetadata(ROLES_KEY, SignatureController)).toEqual([
      UserRoleEnum.Admin,
    ])
  })
})

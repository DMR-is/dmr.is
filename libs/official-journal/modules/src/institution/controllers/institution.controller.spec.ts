import { ROLES_KEY, UserRoleEnum } from '@dmr.is/constants'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { RoleGuard, StaffTokenGuard } from '../../guards/auth'
import { InstitutionController } from './institution.controller'

/**
 * Pins the guard stack, so a dropped decorator fails the build.
 */
describe('InstitutionController guards', () => {
  it('requires a staff token with the Admin role', () => {
    expect(Reflect.getMetadata('__guards__', InstitutionController)).toEqual([
      TokenJwtAuthGuard,
      StaffTokenGuard,
      RoleGuard,
    ])
    expect(Reflect.getMetadata(ROLES_KEY, InstitutionController)).toEqual([
      UserRoleEnum.Admin,
    ])
  })

  // The generated web client only sends the Authorization header for
  // operations swagger marks as secured. Without this, the next schema
  // regeneration would drop `security` and every institution list 401s.
  it('is marked bearer-secured in swagger', () => {
    expect(
      Reflect.getMetadata('swagger/apiSecurity', InstitutionController),
    ).toEqual([{ bearer: [] }])
  })
})

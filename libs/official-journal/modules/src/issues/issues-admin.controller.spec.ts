import { ROLES_KEY, UserRoleEnum } from '@dmr.is/constants'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { RoleGuard, StaffTokenGuard } from '../guards/auth'
import { IssuesAdminController } from './issues-admin.controller'

/**
 * Generating issues is staff-only. The guards sit on the class (RoleGuard
 * falls back from handler to class metadata), so pin them there: a dropped
 * decorator would otherwise open `POST /issues/generate`.
 */
describe('IssuesAdminController guards', () => {
  it('requires a staff token with the Admin role', () => {
    expect(Reflect.getMetadata('__guards__', IssuesAdminController)).toEqual([
      TokenJwtAuthGuard,
      StaffTokenGuard,
      RoleGuard,
    ])
    expect(Reflect.getMetadata(ROLES_KEY, IssuesAdminController)).toEqual([
      UserRoleEnum.Admin,
    ])
  })
})

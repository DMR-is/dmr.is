import {
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common'

import { DoeUserRole } from '../../../modules/user/types/user-role'
import { RequireAdminRoleGuard } from './require-admin-role.guard'

const createExecutionContext = (request: Record<string, unknown>) =>
  ({
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  }) as never

describe('RequireAdminRoleGuard', () => {
  let guard: RequireAdminRoleGuard

  beforeEach(() => {
    guard = new RequireAdminRoleGuard()
  })

  it('allows an ADMIN user', () => {
    const request = { adminUser: { role: DoeUserRole.ADMIN } }
    expect(guard.canActivate(createExecutionContext(request))).toBe(true)
  })

  it('rejects an EDITOR user with ForbiddenException', () => {
    const request = { adminUser: { role: DoeUserRole.EDITOR } }
    expect(() => guard.canActivate(createExecutionContext(request))).toThrow(
      ForbiddenException,
    )
  })

  it('throws InternalServerErrorException when adminUser is missing (AdminGuard not in the chain)', () => {
    const request = {}
    expect(() => guard.canActivate(createExecutionContext(request))).toThrow(
      InternalServerErrorException,
    )
  })
})

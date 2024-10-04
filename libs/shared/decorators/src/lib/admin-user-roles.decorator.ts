import { ROLES_KEY } from '@dmr.is/constants'
import { AdminUserRoleTitle } from '@dmr.is/types'
import { SetMetadata } from '@nestjs/common'

export const Roles = (...roles: AdminUserRoleTitle[]) =>
  SetMetadata(ROLES_KEY, roles)

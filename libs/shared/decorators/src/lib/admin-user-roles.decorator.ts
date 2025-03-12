import { ROLES_KEY } from '@dmr.is/constants'
import { AdminUserRoleTitle } from '@dmr.is/types'

import { SetMetadata } from '@nestjs/common'

/**
 * This decorator must be placed on controller **methods** not on the controller itself
 * @param roles Required roles to access this endpoint
 * @returns
 */
export const Roles = (...roles: AdminUserRoleTitle[]) =>
  SetMetadata(ROLES_KEY, roles)

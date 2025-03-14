import { ROLES_KEY, UserRoleEnum } from '@dmr.is/constants'

import { SetMetadata } from '@nestjs/common'

/**
 * This decorator must be placed on controller **methods** not on the controller itself
 * @param roles Required roles to access this endpoint
 * @returns
 */
export const Roles = (...roles: UserRoleEnum[]) => SetMetadata(ROLES_KEY, roles)

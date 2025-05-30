import { SetMetadata } from '@nestjs/common'

import { ROLES_KEY, UserRoleEnum } from '@dmr.is/constants'

/**
 * This decorator must be placed on controller **methods** not on the controller itself
 * @param roles Required roles to access this endpoint
 * @returns
 */
export const Roles = (...roles: UserRoleEnum[]) => SetMetadata(ROLES_KEY, roles)

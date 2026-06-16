import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common'

import { getLogger } from '@dmr.is/logging'

import { UserModel } from '../../modules/user/models/user.model'

/**
 * Resolves the acting admin (doe_user) that `AdminGuard` attached to the
 * request. Use only on routes guarded by `TokenJwtAuthGuard` + `AdminGuard`;
 * without that guard chain `request.adminUser` is never populated.
 */
export const CurrentAdminUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserModel => {
    void data

    const request = ctx.switchToHttp().getRequest()
    const logger = getLogger('CurrentAdminUserDecorator')

    if (!request?.adminUser) {
      logger.error('Admin user was not resolved on request')
      throw new UnauthorizedException()
    }

    return request.adminUser
  },
)

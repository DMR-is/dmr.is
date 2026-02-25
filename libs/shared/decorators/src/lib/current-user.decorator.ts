import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common'

import { type DMRUser } from '@dmr.is/auth/dmrUser'
import { getLogger } from '@dmr.is/logging'

/**
 * For admin users these guards are required to get the user
 * - Use `TokenJwtAuthGuard` and `RoleGuard` guards
 *
 * For application users
 * - Use `ApplicationAuthGuard` guard
 */

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): DMRUser => {
    const request = ctx.switchToHttp().getRequest()
    const logger = getLogger('CurrentUserDecorator')

    if (!request?.user?.nationalId) {
      logger.error('Current user does not have a national ID')
      throw new UnauthorizedException()
    }

    request.user.fullName = request.user.name

    if (request.user.actor) {
      request.user.fullName = `${request.user.name} ${request.user.actor.name ? `(${request.user.actor.name})` : '(Innsendandi í umboði)'}`
    }

    return request.user
  },
)

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { getLogger } from '@dmr.is/logging'

import { IUsersService } from '../../modules/users/users.service.interface'
import { ADMIN_KEY } from '../decorators/admin.decorator'

const logger = getLogger('AdminGuard')

/**
 * Guard that checks if the current user has admin access.
 * Admin access is determined by the user existing in the UserModel table.
 *
 * This guard should be used after TokenJwtAuthGuard which sets req.user.
 *
 * @example
 * ```typescript
 * @UseGuards(TokenJwtAuthGuard, ScopesGuard, AdminGuard)
 * @AdminOnly()
 * @Controller('admin')
 * export class AdminController { ... }
 * ```
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(IUsersService) private readonly usersService: IUsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if @AdminOnly() decorator is present on handler or class
    const requiresAdmin = this.reflector.getAllAndOverride<boolean>(ADMIN_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    // If no @AdminOnly() decorator, allow access
    if (!requiresAdmin) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const user = request.user

    if (!user?.nationalId) {
      logger.warn('Admin access denied: No nationalId in request')
      throw new ForbiddenException('Admin access required')
    }

    try {
      // Check if user exists in the UserModel table
      const dbUser = await this.usersService.getUserByNationalId(
        user.nationalId,
      )

      if (!dbUser) {
        logger.warn('Admin access denied: User not found in database', {
          nationalId: user.nationalId,
        })
        throw new ForbiddenException('Admin access required')
      }

      // User exists in database, grant admin access
      logger.debug('Admin access granted', {
        userId: dbUser.id,
        nationalId: user.nationalId,
      })

      return true
    } catch (error) {
      // If error is already a ForbiddenException, rethrow it
      if (error instanceof ForbiddenException) {
        throw error
      }

      // User lookup failed (likely user not found)
      logger.warn('Admin access denied: User lookup failed', {
        nationalId: user.nationalId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw new ForbiddenException('Admin access required')
    }
  }
}

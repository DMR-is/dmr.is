import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { getLogger } from '@dmr.is/logging'
import { SCOPES_KEY } from '@dmr.is/modules/guards/auth'

import { IUsersService } from '../../modules/users/users.service.interface'
import { ADMIN_KEY } from '../decorators/admin.decorator'

const logger = getLogger('AdminGuard')

/**
 * Guard that checks if the current user has admin access.
 * Admin access is determined by the user existing in the UserModel table.
 *
 * This guard supports two modes:
 *
 * 1. **Admin-only mode** (`@AdminOnly()` decorator):
 *    Only admin users (those in UserModel) can access the endpoint.
 *
 * 2. **Admin OR Scope mode** (scopes decorator + `@AdminOnly()`):
 *    Either admin users OR users with matching scopes can access.
 *    This allows endpoints shared between admin and other web apps.
 *
 * This guard should be used after TokenJwtAuthGuard which sets req.user.
 * When combined with ScopesGuard, AdminGuard should come AFTER ScopesGuard
 * to allow admin users to bypass scope checks.
 *
 * @example
 * ```typescript
 * // Admin-only endpoint
 * @UseGuards(TokenJwtAuthGuard, ScopesGuard, AdminGuard)
 * @AdminOnly()
 * @Controller('admin')
 * export class AdminController { ... }
 *
 * // Shared endpoint (admin OR application-web)
 * @UseGuards(TokenJwtAuthGuard, ScopesGuard, AdminGuard)
 * @AdminOrApplicationWebScopes()  // Sets scopes for non-admin users
 * @AdminOnly()                     // Allows admin users to bypass scope check
 * @Controller('shared')
 * export class SharedController { ... }
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

    // Check if scopes are defined (for OR logic)
    const scopes = this.reflector.getAllAndOverride<string[]>(SCOPES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    // If no @AdminOnly() decorator, allow access (ScopesGuard handles scope checks)
    if (!requiresAdmin) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const user = request.user

    if (!user?.nationalId) {
      // If scopes are defined, the user might have passed ScopesGuard already
      // In that case, we should still deny because @AdminOnly is required
      logger.warn('Admin access denied: No nationalId in request')
      throw new ForbiddenException('Admin access required')
    }

    try {
      // Check if user exists in the UserModel table (admin check)
      const dbUser = await this.usersService.getUserByNationalId(
        user.nationalId,
      )

      if (dbUser) {
        // User exists in database, grant admin access
        logger.debug('Admin access granted', {
          userId: dbUser.id,
          nationalId: user.nationalId,
        })
        return true
      }

      // User is not admin - check if they have valid scopes (OR logic)
      if (scopes && scopes.length > 0) {
        const userScopes = user.scope?.split(' ') || []
        const hasValidScope = scopes.some((scope) => userScopes.includes(scope))

        if (hasValidScope) {
          logger.debug('Access granted via scope (non-admin user)', {
            nationalId: user.nationalId,
            matchedScopes: scopes.filter((s) => userScopes.includes(s)),
          })
          return true
        }
      }

      // Neither admin nor valid scope
      logger.warn('Access denied: User not admin and no valid scope', {
        nationalId: user.nationalId,
        requiredScopes: scopes,
      })
      throw new ForbiddenException('Admin access required')
    } catch (error) {
      // If error is already a ForbiddenException, rethrow it
      if (error instanceof ForbiddenException) {
        throw error
      }

      // User lookup failed - check scopes as fallback (OR logic)
      if (scopes && scopes.length > 0) {
        const userScopes = user.scope?.split(' ') || []
        const hasValidScope = scopes.some((scope) => userScopes.includes(scope))

        if (hasValidScope) {
          logger.debug('Access granted via scope (admin lookup failed)', {
            nationalId: user.nationalId,
            matchedScopes: scopes.filter((s) => userScopes.includes(s)),
          })
          return true
        }
      }

      logger.warn('Admin access denied: User lookup failed', {
        nationalId: user.nationalId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw new ForbiddenException('Admin access required')
    }
  }
}

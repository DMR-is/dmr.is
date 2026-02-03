import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { getLogger } from '@dmr.is/logging'

import { UserDto } from '../../models/users.model'
import { IUsersService } from '../../modules/users/users.service.interface'
import { ADMIN_KEY } from '../decorators/admin.decorator'
import { SCOPES_KEY } from './scope-guards/scopes.decorator'

const logger = getLogger('AuthorizationGuard')

/**
 * Unified authorization guard that handles both scope-based and admin-based access control.
 *
 * This guard consolidates the functionality of ScopesGuard and AdminGuard into a single
 * guard that is applied after TokenJwtAuthGuard. It handles authorization based on
 * decorator combinations:
 *
 * | Decorators                    | User Lookup? | Access Logic           |
 * |-------------------------------|--------------|------------------------|
 * | None                          | ❌ No        | Allow (auth only)      |
 * | `@Scopes()` only              | ❌ No        | Check scope            |
 * | `@AdminAccess()` only           | ✅ Yes       | Check admin            |
 * | `@AdminAccess()` + `@Scopes()`  | ⚡ Conditional | Admin OR scope         |
 *
 * ## Key Optimizations:
 * - **No unnecessary database lookups**: Only performs user lookup when `@AdminAccess()` is present
 * - **OR logic for mixed access**: When both decorators present, scope check happens first (cheap), admin lookup only if scope check fails
 * - **Single guard in chain**: Simplifies controller guard configuration
 *
 * ## Usage:
 *
 * @example
 * ```typescript
 * // Auth only - no decorators, allows any authenticated user
 * @UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
 * @Controller('public')
 * export class PublicController { ... }
 *
 * // Scope-only - no user lookup, just checks scope in JWT
 * @UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
 * @PublicWebScopes()  // Sets @Scopes(['@logbirtingablad.is/logbirtingabladid'])
 * @Controller('public')
 * export class PublicController { ... }
 *
 * // Admin-only - requires user in UserModel table
 * @UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
 * @AdminAccess()
 * @Controller('admin')
 * export class AdminController { ... }
 *
 * // Mixed access (admin OR scope) - scope users bypass admin check (optimization)
 * @UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
 * @AdminAccess()
 * @ApplicationWebScopes()
 * @Controller('shared')
 * export class SharedController {
 *   // Method with different scope requirement
 *   @PublicWebScopes()
 *   getPublicData() { ... }
 * }
 * ```
 */
@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(IUsersService) private readonly usersService: IUsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check for decorators on handler (method) and class
    const requiresAdmin = this.reflector.getAllAndOverride<boolean>(ADMIN_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    const requiredScopes = this.reflector.getAllAndOverride<string[]>(
      SCOPES_KEY,
      [context.getHandler(), context.getClass()],
    )

    // Case 1: No decorators - allow access (auth only)
    if (!requiresAdmin && !requiredScopes?.length) {
      logger.debug('No authorization decorators, allowing authenticated access')
      return true
    }

    const request = context.switchToHttp().getRequest()
    const user = request.user

    // Case 2: @Scopes() only - check scope without user lookup
    if (!requiresAdmin && requiredScopes?.length) {
      return this.checkScopes(user, requiredScopes)
    }

    // Case 3 & 4: @AdminAccess() present
    // Optimization: If scopes are also present, check scope first (cheap operation)
    if (requiredScopes?.length) {
      // Case 4: Both @AdminAccess() and @Scopes()
      const hasValidScope = this.hasMatchingScope(user, requiredScopes)

      if (hasValidScope) {
        logger.debug('Access granted via scope (admin check skipped)', {
          nationalId: user?.nationalId,
          matchedScopes: this.getMatchingScopes(user, requiredScopes),
        })
        return true
      }

      // Scope check failed, fall through to admin check
    }

    // Check admin access (expensive database lookup)
    try {
      const adminUser = await this.checkAdminAccess(user)

      request.user = {
        ...request.user,
        adminUserId: adminUser.id,
      }

      logger.debug('Admin access granted', {
        nationalId: user?.nationalId,
      })

      return true
    } catch (error) {
      // Admin check failed
    }

    // Access denied - neither admin nor valid scope
    if (requiredScopes?.length) {
      // Case 4: Both decorators present, both checks failed
      logger.warn('Access denied: User not admin and no valid scope', {
        nationalId: user?.nationalId,
        requiredScopes,
      })
    } else {
      // Case 3: Admin only, admin check failed
      logger.warn('Admin access denied: User not in admin table', {
        nationalId: user?.nationalId,
      })
    }

    throw new ForbiddenException('Admin access required')
  }

  /**
   * Check if user has valid scopes (no admin check).
   * Used when only @Scopes() decorator is present.
   */
  private checkScopes(
    user: { scope?: string; nationalId?: string } | undefined,
    requiredScopes: string[],
  ): boolean {
    if (!user) {
      logger.warn('Scope check failed: No user in request')
      return false
    }

    const hasScope = this.hasMatchingScope(user, requiredScopes)

    if (!hasScope) {
      logger.warn('Scope check failed: Missing required scope', {
        nationalId: user.nationalId,
        requiredScopes,
        userScopes: user.scope?.split(' ') || [],
      })
      return false
    }

    logger.debug('Scope check passed', {
      nationalId: user.nationalId,
      matchedScopes: this.getMatchingScopes(user, requiredScopes),
    })
    return true
  }

  /**
   * Check if user exists in the UserModel table (admin check).
   * Returns false on error or if user not found.
   */
  private async checkAdminAccess(
    user: { nationalId?: string } | undefined,
  ): Promise<UserDto> {
    if (!user?.nationalId) {
      logger.debug('Admin check skipped: No nationalId in request')
      throw new ForbiddenException('Admin access required')
    }

    try {
      const dbUser = await this.usersService.getUserByNationalId(
        user.nationalId,
        true,
      )

      return dbUser
    } catch (error) {
      logger.warn('Admin lookup failed', {
        nationalId: user.nationalId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw new ForbiddenException('Admin access required')
    }
  }

  /**
   * Check if user has at least one of the required scopes.
   */
  private hasMatchingScope(
    user: { scope?: string } | undefined,
    requiredScopes: string[],
  ): boolean {
    const userScopes = user?.scope?.split(' ') || []
    return requiredScopes.some((scope) => userScopes.includes(scope))
  }

  /**
   * Get the scopes that match between user and required scopes.
   */
  private getMatchingScopes(
    user: { scope?: string } | undefined,
    requiredScopes: string[],
  ): string[] {
    const userScopes = user?.scope?.split(' ') || []
    return requiredScopes.filter((scope) => userScopes.includes(scope))
  }
}

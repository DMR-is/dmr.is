import { Global, Module } from '@nestjs/common'

import { UsersProviderModule } from '../../modules/users/users.provider.module'
import { AuthorizationGuard } from './authorization.guard'

/**
 * Module that provides the AuthorizationGuard globally.
 *
 * This module must be imported at the app level to make these guards
 * available to all controller modules without requiring them to
 * import UsersProviderModule individually.
 *
 * The module re-exports UsersProviderModule so that IUsersService
 * is available globally for guard dependency resolution.
 *
 * ## Guards Provided:
 * - **AuthorizationGuard** (recommended): Unified guard for both scope and admin checks
 *
 * @example
 * ```typescript
 * // app.module.ts
 * @Module({
 *   imports: [
 *     AuthorizationGuardModule,  // Makes guards available globally
 *     ...
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Global()
@Module({
  imports: [UsersProviderModule],
  providers: [AuthorizationGuard],
  exports: [AuthorizationGuard, UsersProviderModule],
})
export class AuthorizationGuardModule {}

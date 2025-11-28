import { Global, Module } from '@nestjs/common'

import { UsersProviderModule } from '../../modules/users/users.provider.module'
import { AdminGuard } from './admin.guard'

/**
 * Module that provides the AdminGuard globally.
 *
 * This module must be imported at the app level to make AdminGuard
 * available to all controller modules without requiring them to
 * import UsersProviderModule individually.
 *
 * The module re-exports UsersProviderModule so that IUsersService
 * is available globally for AdminGuard dependency resolution.
 *
 * @example
 * ```typescript
 * // app.module.ts
 * @Module({
 *   imports: [
 *     AdminGuardModule,  // Makes AdminGuard available globally
 *     ...
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Global()
@Module({
  imports: [UsersProviderModule],
  providers: [AdminGuard],
  exports: [AdminGuard, UsersProviderModule],
})
export class AdminGuardModule {}

import { Module } from '@nestjs/common'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { RequireAdminRoleGuard } from '../../core/guards/admin-role/require-admin-role.guard'
import { AuthorizationCoreModule } from '../authorization/authorization.core.module'
import { CompanyCoreModule } from '../company/company.core.module'
import { ApiKeyController } from './api-key.controller'
import { ApiKeyCoreModule } from './api-key.core.module'

/**
 * `AuthorizationCoreModule` is required, not optional: `AdminGuard` injects
 * `IAuthorizationService`, and a missing provider only surfaces when something
 * boots the container — the swagger and middleware specs, never a unit test.
 * Mirrors `UserApiModule` and `ConfigApiModule`.
 */
@Module({
  imports: [ApiKeyCoreModule, CompanyCoreModule, AuthorizationCoreModule],
  controllers: [ApiKeyController],
  providers: [AdminGuard, RequireAdminRoleGuard],
})
export class ApiKeyApiModule {}

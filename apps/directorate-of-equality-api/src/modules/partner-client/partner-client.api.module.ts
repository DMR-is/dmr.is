import { Module } from '@nestjs/common'

import { AuthorizationCoreModule } from '@dmr.is/doe-modules/authorization'
import { PartnerClientCoreModule } from '@dmr.is/doe-modules/partner-client'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { RequireAdminRoleGuard } from '../../core/guards/admin-role/require-admin-role.guard'
import { PartnerClientController } from './partner-client.controller'

/**
 * `AuthorizationCoreModule` is required: `AdminGuard` injects
 * `IAuthorizationService`. Mirrors `ApiKeyApiModule`.
 */
@Module({
  imports: [PartnerClientCoreModule, AuthorizationCoreModule],
  controllers: [PartnerClientController],
  providers: [AdminGuard, RequireAdminRoleGuard],
})
export class PartnerClientApiModule {}

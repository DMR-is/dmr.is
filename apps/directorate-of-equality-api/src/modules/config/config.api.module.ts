import { Module } from '@nestjs/common'

import { AuthorizationCoreModule } from '@dmr.is/doe-modules/authorization'
import { ConfigCoreModule } from '@dmr.is/doe-modules/config'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { RequireAdminRoleGuard } from '../../core/guards/admin-role/require-admin-role.guard'
import { ConfigController } from './config.controller'

@Module({
  imports: [ConfigCoreModule, AuthorizationCoreModule],
  controllers: [ConfigController],
  providers: [AdminGuard, RequireAdminRoleGuard],
})
export class ConfigApiModule {}

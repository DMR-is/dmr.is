import { Module } from '@nestjs/common'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { RequireAdminRoleGuard } from '../../core/guards/admin-role/require-admin-role.guard'
import { AuthorizationCoreModule } from '../authorization/authorization.core.module'
import { ConfigController } from './config.controller'
import { ConfigCoreModule } from './config.core.module'

@Module({
  imports: [ConfigCoreModule, AuthorizationCoreModule],
  controllers: [ConfigController],
  providers: [AdminGuard, RequireAdminRoleGuard],
})
export class ConfigApiModule {}

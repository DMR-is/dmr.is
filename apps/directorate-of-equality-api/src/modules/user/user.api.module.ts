import { Module } from '@nestjs/common'

import { AuthorizationCoreModule } from '@dmr.is/doe-modules/authorization'
import { UserCoreModule } from '@dmr.is/doe-modules/user'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { RequireAdminRoleGuard } from '../../core/guards/admin-role/require-admin-role.guard'
import { UserController } from './user.controller'

@Module({
  imports: [UserCoreModule, AuthorizationCoreModule],
  controllers: [UserController],
  providers: [AdminGuard, RequireAdminRoleGuard],
})
export class UserApiModule {}

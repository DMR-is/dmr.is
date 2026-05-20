import { Module } from '@nestjs/common'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { RequireAdminRoleGuard } from '../../core/guards/admin-role/require-admin-role.guard'
import { AuthorizationCoreModule } from '../authorization/authorization.core.module'
import { UserController } from './user.controller'
import { UserCoreModule } from './user.core.module'

@Module({
  imports: [UserCoreModule, AuthorizationCoreModule],
  controllers: [UserController],
  providers: [AdminGuard, RequireAdminRoleGuard],
})
export class UserApiModule {}

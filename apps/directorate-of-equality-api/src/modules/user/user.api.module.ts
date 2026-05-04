import { Module } from '@nestjs/common'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { AuthorizationCoreModule } from '../authorization/authorization.core.module'
import { UserController } from './user.controller'
import { UserCoreModule } from './user.core.module'

@Module({
  imports: [UserCoreModule, AuthorizationCoreModule],
  controllers: [UserController],
  providers: [AdminGuard],
})
export class UserApiModule {}

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { UserModel } from './models/user.model'
import { UserController } from './user.controller'
import { UserCoreModule } from './user.core.module'

@Module({
  imports: [UserCoreModule, SequelizeModule.forFeature([UserModel])],
  controllers: [UserController],
  providers: [AdminGuard],
})
export class UserApiModule {}

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { UserModel } from '../user/models/user.model'
import { ConfigController } from './config.controller'
import { ConfigCoreModule } from './config.core.module'

@Module({
  imports: [ConfigCoreModule, SequelizeModule.forFeature([UserModel])],
  controllers: [ConfigController],
  providers: [AdminGuard],
})
export class ConfigApiModule {}

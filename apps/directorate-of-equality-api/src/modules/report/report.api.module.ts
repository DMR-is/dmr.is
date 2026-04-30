import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { UserModel } from '../user/models/user.model'
import { ReportController } from './report.controller'
import { ReportCoreModule } from './report.core.module'

@Module({
  imports: [ReportCoreModule, SequelizeModule.forFeature([UserModel])],
  controllers: [ReportController],
  providers: [AdminGuard],
})
export class ReportApiModule {}

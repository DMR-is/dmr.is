import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { UserModel } from '../user/models/user.model'
import { ReportResultController } from './report-result.controller'
import { ReportResultCoreModule } from './report-result.core.module'

@Module({
  imports: [ReportResultCoreModule, SequelizeModule.forFeature([UserModel])],
  controllers: [ReportResultController],
  providers: [AdminGuard],
})
export class ReportResultApiModule {}

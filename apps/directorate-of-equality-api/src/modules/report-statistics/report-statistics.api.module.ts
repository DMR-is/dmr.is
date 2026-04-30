import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { UserModel } from '../user/models/user.model'
import { ReportStatisticsController } from './report-statistics.controller'
import { ReportStatisticsCoreModule } from './report-statistics.core.module'

@Module({
  imports: [
    ReportStatisticsCoreModule,
    SequelizeModule.forFeature([UserModel]),
  ],
  controllers: [ReportStatisticsController],
  providers: [AdminGuard],
})
export class ReportStatisticsApiModule {}

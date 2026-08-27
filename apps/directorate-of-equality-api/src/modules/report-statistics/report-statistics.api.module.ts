import { Module } from '@nestjs/common'

import {
  AuthorizationCoreModule,
  ReportStatisticsCoreModule,
} from '@dmr.is/doe-modules'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { ReportStatisticsController } from './report-statistics.controller'

@Module({
  imports: [ReportStatisticsCoreModule, AuthorizationCoreModule],
  controllers: [ReportStatisticsController],
  providers: [AdminGuard],
})
export class ReportStatisticsApiModule {}

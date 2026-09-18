import { Module } from '@nestjs/common'

import { AuthorizationCoreModule } from '@dmr.is/doe-modules/authorization'
import { ReportStatisticsCoreModule } from '@dmr.is/doe-modules/report-statistics'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { ReportStatisticsController } from './report-statistics.controller'

@Module({
  imports: [ReportStatisticsCoreModule, AuthorizationCoreModule],
  controllers: [ReportStatisticsController],
  providers: [AdminGuard],
})
export class ReportStatisticsApiModule {}

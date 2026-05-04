import { Module } from '@nestjs/common'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { AuthorizationCoreModule } from '../authorization/authorization.core.module'
import { ReportStatisticsController } from './report-statistics.controller'
import { ReportStatisticsCoreModule } from './report-statistics.core.module'

@Module({
  imports: [ReportStatisticsCoreModule, AuthorizationCoreModule],
  controllers: [ReportStatisticsController],
  providers: [AdminGuard],
})
export class ReportStatisticsApiModule {}

import { Module } from '@nestjs/common'

import { AuthorizationCoreModule } from '@dmr.is/doe-modules/authorization'
import { ReportResultCoreModule } from '@dmr.is/doe-modules/report-result'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { ReportResultController } from './report-result.controller'

@Module({
  imports: [ReportResultCoreModule, AuthorizationCoreModule],
  controllers: [ReportResultController],
  providers: [AdminGuard],
})
export class ReportResultApiModule {}

import { Module } from '@nestjs/common'

import { AuthorizationCoreModule } from '@dmr.is/doe-modules/authorization'
import { ReportWorkflowCoreModule } from '@dmr.is/doe-modules/report-workflow'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { ReportWorkflowController } from './report-workflow.controller'

@Module({
  imports: [ReportWorkflowCoreModule, AuthorizationCoreModule],
  controllers: [ReportWorkflowController],
  providers: [AdminGuard],
})
export class ReportWorkflowApiModule {}

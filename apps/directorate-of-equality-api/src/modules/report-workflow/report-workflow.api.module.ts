import { Module } from '@nestjs/common'

import {
  AuthorizationCoreModule,
  ReportWorkflowCoreModule,
} from '@dmr.is/doe-modules'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { ReportWorkflowController } from './report-workflow.controller'

@Module({
  imports: [ReportWorkflowCoreModule, AuthorizationCoreModule],
  controllers: [ReportWorkflowController],
  providers: [AdminGuard],
})
export class ReportWorkflowApiModule {}

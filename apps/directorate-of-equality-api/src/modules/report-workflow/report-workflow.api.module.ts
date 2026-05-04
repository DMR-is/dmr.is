import { Module } from '@nestjs/common'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { AuthorizationCoreModule } from '../authorization/authorization.core.module'
import { ReportWorkflowController } from './report-workflow.controller'
import { ReportWorkflowCoreModule } from './report-workflow.core.module'

@Module({
  imports: [ReportWorkflowCoreModule, AuthorizationCoreModule],
  controllers: [ReportWorkflowController],
  providers: [AdminGuard],
})
export class ReportWorkflowApiModule {}

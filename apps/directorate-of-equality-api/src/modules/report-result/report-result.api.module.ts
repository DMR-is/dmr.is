import { Module } from '@nestjs/common'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { AuthorizationCoreModule } from '../authorization/authorization.core.module'
import { ReportResultController } from './report-result.controller'
import { ReportResultCoreModule } from './report-result.core.module'

@Module({
  imports: [ReportResultCoreModule, AuthorizationCoreModule],
  controllers: [ReportResultController],
  providers: [AdminGuard],
})
export class ReportResultApiModule {}

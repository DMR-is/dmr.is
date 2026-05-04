import { Module } from '@nestjs/common'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { AuthorizationCoreModule } from '../authorization/authorization.core.module'
import { ReportController } from './report.controller'
import { ReportCoreModule } from './report.core.module'

@Module({
  imports: [ReportCoreModule, AuthorizationCoreModule],
  controllers: [ReportController],
  providers: [AdminGuard],
})
export class ReportApiModule {}

import { Module } from '@nestjs/common'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { AuthorizationCoreModule } from '../authorization/authorization.core.module'
import { CompanyCoreModule } from '../company/company.core.module'
import { ReportCreateCoreModule } from '../report-create/report-create.core.module'
import { ReportExcelCoreModule } from '../report-excel/report-excel.core.module'
import { AdminReportController } from './admin-report.controller'

@Module({
  imports: [
    AuthorizationCoreModule,
    CompanyCoreModule,
    ReportExcelCoreModule,
    ReportCreateCoreModule,
  ],
  controllers: [AdminReportController],
  providers: [AdminGuard],
})
export class AdminReportApiModule {}

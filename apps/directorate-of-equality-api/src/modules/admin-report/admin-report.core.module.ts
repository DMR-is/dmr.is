import { Module } from '@nestjs/common'

import { CompanyCoreModule } from '../company/company.core.module'
import { ReportCoreModule } from '../report/report.core.module'
import { ReportCreateCoreModule } from '../report-create/report-create.core.module'
import { AdminReportService } from './admin-report.service'
import { IAdminReportService } from './admin-report.service.interface'

@Module({
  imports: [CompanyCoreModule, ReportCoreModule, ReportCreateCoreModule],
  providers: [
    {
      provide: IAdminReportService,
      useClass: AdminReportService,
    },
  ],
  exports: [IAdminReportService],
})
export class AdminReportCoreModule {}

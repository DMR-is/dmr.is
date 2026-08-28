import { Module } from '@nestjs/common'

import { AdminReportCoreModule } from '@dmr.is/doe-modules/admin-report'
import { AuthorizationCoreModule } from '@dmr.is/doe-modules/authorization'
import { ImportUploadCoreModule } from '@dmr.is/doe-modules/import-upload'
import { ReportExcelCoreModule } from '@dmr.is/doe-modules/report-excel'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { AdminReportController } from './admin-report.controller'

@Module({
  imports: [
    AuthorizationCoreModule,
    AdminReportCoreModule,
    ReportExcelCoreModule,
    ImportUploadCoreModule,
  ],
  controllers: [AdminReportController],
  providers: [AdminGuard],
})
export class AdminReportApiModule {}

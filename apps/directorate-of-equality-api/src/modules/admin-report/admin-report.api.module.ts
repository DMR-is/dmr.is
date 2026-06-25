import { Module } from '@nestjs/common'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { AuthorizationCoreModule } from '../authorization/authorization.core.module'
import { ImportUploadCoreModule } from '../import-upload/import-upload.core.module'
import { ReportExcelCoreModule } from '../report-excel/report-excel.core.module'
import { AdminReportController } from './admin-report.controller'
import { AdminReportCoreModule } from './admin-report.core.module'

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

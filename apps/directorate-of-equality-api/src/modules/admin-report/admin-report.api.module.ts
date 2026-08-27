import { Module } from '@nestjs/common'

import {
  AdminReportCoreModule,
  AuthorizationCoreModule,
  ImportUploadCoreModule,
  ReportExcelCoreModule,
} from '@dmr.is/doe-modules'

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

import { Module } from '@nestjs/common'

import {
  AuthorizationCoreModule,
  ImportUploadCoreModule,
  ReportExcelCoreModule,
} from '@dmr.is/doe-modules'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { ReportExcelController } from './report-excel.controller'

@Module({
  imports: [
    ReportExcelCoreModule,
    AuthorizationCoreModule,
    ImportUploadCoreModule,
  ],
  controllers: [ReportExcelController],
  providers: [AdminGuard],
})
export class ReportExcelApiModule {}

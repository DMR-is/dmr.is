import { Module } from '@nestjs/common'

import { AuthorizationCoreModule } from '@dmr.is/doe-modules/authorization'
import { ImportUploadCoreModule } from '@dmr.is/doe-modules/import-upload'
import { ReportExcelCoreModule } from '@dmr.is/doe-modules/report-excel'

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

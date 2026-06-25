import { Module } from '@nestjs/common'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { AuthorizationCoreModule } from '../authorization/authorization.core.module'
import { ImportUploadCoreModule } from '../import-upload/import-upload.core.module'
import { ReportExcelController } from './report-excel.controller'
import { ReportExcelCoreModule } from './report-excel.core.module'

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

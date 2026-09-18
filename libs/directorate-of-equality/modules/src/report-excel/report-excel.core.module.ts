import { Module } from '@nestjs/common'

import { ImportUploadCoreModule } from '../import-upload/import-upload.core.module'
import { ParseGateCoreModule } from '../parse-gate/parse-gate.core.module'
import { ReportExcelService } from './report-excel.service'
import { IReportExcelService } from './report-excel.service.interface'

@Module({
  imports: [ParseGateCoreModule, ImportUploadCoreModule],
  providers: [
    {
      provide: IReportExcelService,
      useClass: ReportExcelService,
    },
  ],
  exports: [IReportExcelService],
})
export class ReportExcelCoreModule {}

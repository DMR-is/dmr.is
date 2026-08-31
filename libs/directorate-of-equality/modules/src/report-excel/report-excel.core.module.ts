import { Module } from '@nestjs/common'

import { ParseGateCoreModule } from '../parse-gate/parse-gate.core.module'
import { ReportExcelService } from './report-excel.service'
import { IReportExcelService } from './report-excel.service.interface'

@Module({
  imports: [ParseGateCoreModule],
  providers: [
    {
      provide: IReportExcelService,
      useClass: ReportExcelService,
    },
  ],
  exports: [IReportExcelService],
})
export class ReportExcelCoreModule {}

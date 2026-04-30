import { Module } from '@nestjs/common'

import { ReportExcelService } from './report-excel.service'
import { IReportExcelService } from './report-excel.service.interface'

@Module({
  providers: [
    {
      provide: IReportExcelService,
      useClass: ReportExcelService,
    },
  ],
  exports: [IReportExcelService],
})
export class ReportExcelCoreModule {}

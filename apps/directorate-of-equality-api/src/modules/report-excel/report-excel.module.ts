import { Module } from '@nestjs/common'

import { ReportExcelController } from './report-excel.controller'
import { ReportExcelService } from './report-excel.service'
import { IReportExcelService } from './report-excel.service.interface'

@Module({
  imports: [],
  controllers: [ReportExcelController],
  providers: [
    {
      provide: IReportExcelService,
      useClass: ReportExcelService,
    },
  ],
  exports: [IReportExcelService],
})
export class ReportExcelModule {}

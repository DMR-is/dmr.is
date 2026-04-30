import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { ConfigModel } from '../config/models/config.model'
import { ReportModel } from '../report/models/report.model'
import { ReportEmployeeModel } from '../report-employee/models/report-employee.model'
import { ReportResultModel } from './models/report-result.model'
import { ReportResultService } from './report-result.service'
import { IReportResultService } from './report-result.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([
      ReportModel,
      ReportEmployeeModel,
      ReportResultModel,
      ConfigModel,
    ]),
  ],
  providers: [
    {
      provide: IReportResultService,
      useClass: ReportResultService,
    },
  ],
  exports: [IReportResultService],
})
export class ReportResultCoreModule {}

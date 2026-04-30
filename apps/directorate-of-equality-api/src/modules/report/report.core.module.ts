import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { ReportEmployeeOutlierModel } from '../report-employee/models/report-employee-outlier.model'
import { ReportRoleResultModel } from '../report-result/models/report-role-result.model'
import { ReportModel } from './models/report.model'
import { ReportEventModel } from './models/report-event.model'
import { ReportService } from './report.service'
import { IReportService } from './report.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([
      ReportModel,
      ReportEventModel,
      ReportRoleResultModel,
      ReportEmployeeOutlierModel,
    ]),
  ],
  providers: [
    {
      provide: IReportService,
      useClass: ReportService,
    },
  ],
  exports: [IReportService],
})
export class ReportCoreModule {}

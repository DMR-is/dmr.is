import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { ReportModel } from '../report/models/report.model'
import { ReportEmployeeModel } from '../report-employee/models/report-employee.model'
import { ReportEmployeeOutlierModel } from '../report-employee/models/report-employee-outlier.model'
import { ReportResultModel } from '../report-result/models/report-result.model'
import { ReportAutoReviewService } from './report-auto-review.service'
import { IReportAutoReviewService } from './report-auto-review.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([
      ReportModel,
      ReportResultModel,
      ReportEmployeeModel,
      ReportEmployeeOutlierModel,
    ]),
  ],
  providers: [
    {
      provide: IReportAutoReviewService,
      useClass: ReportAutoReviewService,
    },
  ],
  exports: [IReportAutoReviewService],
})
export class ReportAutoReviewCoreModule {}

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CompanyReportModel } from '../company/models/company-report.model'
import { ReportEmployeeModel } from '../report-employee/models/report-employee.model'
import { ReportEmployeeDeviationModel } from '../report-employee/models/report-employee-deviation.model'
import { ReportResultModel } from '../report-result/models/report-result.model'
import { ReportRoleResultModel } from '../report-result/models/report-role-result.model'
import { UserModel } from '../user/models/user.model'
import { ReportModel } from './models/report.model'
import { ReportCommentModel } from './models/report-comment.model'
import { ReportController } from './report.controller'
import { ReportService } from './report.service'
import { IReportService } from './report.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([
      ReportModel,
      CompanyReportModel,
      ReportCommentModel,
      UserModel,
      ReportResultModel,
      ReportRoleResultModel,
      ReportEmployeeModel,
      ReportEmployeeDeviationModel,
    ]),
  ],
  controllers: [ReportController],
  providers: [
    {
      provide: IReportService,
      useClass: ReportService,
    },
  ],
  exports: [IReportService],
})
export class ReportModule {}

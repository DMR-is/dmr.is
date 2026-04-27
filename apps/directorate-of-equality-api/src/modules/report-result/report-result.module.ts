import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { ConfigModel } from '../config/models/config.model'
import { ReportModel } from '../report/models/report.model'
import { ReportEmployeeModel } from '../report-employee/models/report-employee.model'
import { ReportEmployeeRoleModel } from '../report-employee/models/report-employee-role.model'
import { ReportResultModel } from './models/report-result.model'
import { ReportRoleResultModel } from './models/report-role-result.model'
import { ReportResultController } from './report-result.controller'
import { ReportResultService } from './report-result.service'
import { IReportResultService } from './report-result.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([
      ReportModel,
      ReportEmployeeModel,
      ReportEmployeeRoleModel,
      ReportResultModel,
      ReportRoleResultModel,
      ConfigModel,
    ]),
  ],
  controllers: [ReportResultController],
  providers: [
    {
      provide: IReportResultService,
      useClass: ReportResultService,
    },
  ],
  exports: [IReportResultService],
})
export class ReportResultModule {}

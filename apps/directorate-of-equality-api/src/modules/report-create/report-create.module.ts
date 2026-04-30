import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CompanyModel } from '../company/models/company.model'
import { CompanyReportModel } from '../company/models/company-report.model'
import { ConfigModule } from '../config/config.module'
import { ReportModel } from '../report/models/report.model'
import { ReportEventModel } from '../report/models/report-event.model'
import { ReportCriterionModel } from '../report-criterion/models/report-criterion.model'
import { ReportSubCriterionModel } from '../report-criterion/models/report-sub-criterion.model'
import { ReportSubCriterionStepModel } from '../report-criterion/models/report-sub-criterion-step.model'
import { ReportEmployeeModel } from '../report-employee/models/report-employee.model'
import { ReportEmployeeOutlierModel } from '../report-employee/models/report-employee-outlier.model'
import { ReportEmployeePersonalCriterionStepModel } from '../report-employee/models/report-employee-personal-criterion-step.model'
import { ReportEmployeeRoleModel } from '../report-employee/models/report-employee-role.model'
import { ReportEmployeeRoleCriterionStepModel } from '../report-employee/models/report-employee-role-criterion-step.model'
import { ReportResultModule } from '../report-result/report-result.module'
import { ReportCreateController } from './report-create.controller'
import { ReportCreateService } from './report-create.service'
import { IReportCreateService } from './report-create.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([
      ReportModel,
      ReportEventModel,
      CompanyModel,
      CompanyReportModel,
      ReportEmployeeRoleModel,
      ReportEmployeeModel,
      ReportEmployeeOutlierModel,
      ReportEmployeeRoleCriterionStepModel,
      ReportEmployeePersonalCriterionStepModel,
      ReportCriterionModel,
      ReportSubCriterionModel,
      ReportSubCriterionStepModel,
    ]),
    ReportResultModule,
    ConfigModule,
  ],
  controllers: [ReportCreateController],
  providers: [
    {
      provide: IReportCreateService,
      useClass: ReportCreateService,
    },
  ],
  exports: [IReportCreateService],
})
export class ReportCreateModule {}

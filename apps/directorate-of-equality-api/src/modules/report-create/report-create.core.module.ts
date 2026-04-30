import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CompanyReportModel } from '../company/models/company-report.model'
import { ConfigCoreModule } from '../config/config.core.module'
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
import { ReportResultCoreModule } from '../report-result/report-result.core.module'
import { ReportCreateService } from './report-create.service'
import { IReportCreateService } from './report-create.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([
      ReportModel,
      ReportEventModel,
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
    ReportResultCoreModule,
    ConfigCoreModule,
  ],
  providers: [
    {
      provide: IReportCreateService,
      useClass: ReportCreateService,
    },
  ],
  exports: [IReportCreateService],
})
export class ReportCreateCoreModule {}

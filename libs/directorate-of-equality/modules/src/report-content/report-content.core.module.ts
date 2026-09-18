import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { ReportCriterionModel } from '../report-criterion/models/report-criterion.model'
import { ReportSubCriterionModel } from '../report-criterion/models/report-sub-criterion.model'
import { ReportSubCriterionStepModel } from '../report-criterion/models/report-sub-criterion-step.model'
import { ReportEmployeeModel } from '../report-employee/models/report-employee.model'
import { ReportEmployeePersonalCriterionStepModel } from '../report-employee/models/report-employee-personal-criterion-step.model'
import { ReportEmployeeRoleModel } from '../report-employee/models/report-employee-role.model'
import { ReportEmployeeRoleCriterionStepModel } from '../report-employee/models/report-employee-role-criterion-step.model'
import { ReportContentService } from './report-content.service'
import { IReportContentService } from './report-content.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([
      ReportEmployeeRoleModel,
      ReportCriterionModel,
      ReportSubCriterionModel,
      ReportSubCriterionStepModel,
      ReportEmployeeRoleCriterionStepModel,
      ReportEmployeeModel,
      ReportEmployeePersonalCriterionStepModel,
    ]),
  ],
  providers: [
    {
      provide: IReportContentService,
      useClass: ReportContentService,
    },
  ],
  exports: [IReportContentService],
})
export class ReportContentCoreModule {}

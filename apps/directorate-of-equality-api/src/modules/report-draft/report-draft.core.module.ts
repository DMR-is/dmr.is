import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { ReportModel } from '../report/models/report.model'
import { ReportCriterionModel } from '../report-criterion/models/report-criterion.model'
import { ReportSubCriterionModel } from '../report-criterion/models/report-sub-criterion.model'
import { ReportSubCriterionStepModel } from '../report-criterion/models/report-sub-criterion-step.model'
import { ReportEmployeeModel } from '../report-employee/models/report-employee.model'
import { ReportEmployeePersonalCriterionStepModel } from '../report-employee/models/report-employee-personal-criterion-step.model'
import { ReportEmployeeRoleModel } from '../report-employee/models/report-employee-role.model'
import { ReportEmployeeRoleCriterionStepModel } from '../report-employee/models/report-employee-role-criterion-step.model'
import { ReportOutlierGroupModel } from '../report-employee/models/report-outlier-group.model'
import { ReportDraftService } from './report-draft.service'
import { IReportDraftService } from './report-draft.service.interface'
import { ReportDraftCriterionService } from './report-draft-criterion.service'
import { IReportDraftCriterionService } from './report-draft-criterion.service.interface'
import { ReportDraftEmployeeService } from './report-draft-employee.service'
import { IReportDraftEmployeeService } from './report-draft-employee.service.interface'
import { ReportDraftRoleService } from './report-draft-role.service'
import { IReportDraftRoleService } from './report-draft-role.service.interface'
import { ReportDraftStepService } from './report-draft-step.service'
import { IReportDraftStepService } from './report-draft-step.service.interface'
import { ReportDraftSubCriterionService } from './report-draft-sub-criterion.service'
import { IReportDraftSubCriterionService } from './report-draft-sub-criterion.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([
      ReportModel,
      ReportEmployeeModel,
      ReportEmployeeRoleModel,
      ReportCriterionModel,
      ReportSubCriterionModel,
      ReportSubCriterionStepModel,
      ReportEmployeeRoleCriterionStepModel,
      ReportEmployeePersonalCriterionStepModel,
      ReportOutlierGroupModel,
    ]),
  ],
  providers: [
    {
      provide: IReportDraftService,
      useClass: ReportDraftService,
    },
    {
      provide: IReportDraftRoleService,
      useClass: ReportDraftRoleService,
    },
    {
      provide: IReportDraftEmployeeService,
      useClass: ReportDraftEmployeeService,
    },
    {
      provide: IReportDraftCriterionService,
      useClass: ReportDraftCriterionService,
    },
    {
      provide: IReportDraftSubCriterionService,
      useClass: ReportDraftSubCriterionService,
    },
    {
      provide: IReportDraftStepService,
      useClass: ReportDraftStepService,
    },
  ],
  exports: [
    IReportDraftService,
    IReportDraftRoleService,
    IReportDraftEmployeeService,
    IReportDraftCriterionService,
    IReportDraftSubCriterionService,
    IReportDraftStepService,
  ],
})
export class ReportDraftCoreModule {}

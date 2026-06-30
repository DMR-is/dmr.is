import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { ConfigCoreModule } from '../config/config.core.module'
import { ReportModel } from '../report/models/report.model'
import { ReportCriterionModel } from '../report-criterion/models/report-criterion.model'
import { ReportSubCriterionModel } from '../report-criterion/models/report-sub-criterion.model'
import { ReportSubCriterionStepModel } from '../report-criterion/models/report-sub-criterion-step.model'
import { ReportEmployeeModel } from '../report-employee/models/report-employee.model'
import { ReportEmployeePersonalCriterionStepModel } from '../report-employee/models/report-employee-personal-criterion-step.model'
import { ReportEmployeeRoleModel } from '../report-employee/models/report-employee-role.model'
import { ReportEmployeeRoleCriterionStepModel } from '../report-employee/models/report-employee-role-criterion-step.model'
import { ReportOutlierGroupModel } from '../report-employee/models/report-outlier-group.model'
import { ReportDraftAnalysisService } from './analysis/report-draft-analysis.service'
import { IReportDraftAnalysisService } from './analysis/report-draft-analysis.service.interface'
import { ReportDraftAssignmentService } from './assignment/report-draft-assignment.service'
import { IReportDraftAssignmentService } from './assignment/report-draft-assignment.service.interface'
import { ReportDraftCriterionService } from './criterion/report-draft-criterion.service'
import { IReportDraftCriterionService } from './criterion/report-draft-criterion.service.interface'
import { ReportDraftService } from './draft/report-draft.service'
import { IReportDraftService } from './draft/report-draft.service.interface'
import { ReportDraftEmployeeService } from './employee/report-draft-employee.service'
import { IReportDraftEmployeeService } from './employee/report-draft-employee.service.interface'
import { ReportDraftRoleService } from './role/report-draft-role.service'
import { IReportDraftRoleService } from './role/report-draft-role.service.interface'
import { ReportDraftStepService } from './step/report-draft-step.service'
import { IReportDraftStepService } from './step/report-draft-step.service.interface'
import { ReportDraftSubCriterionService } from './sub-criterion/report-draft-sub-criterion.service'
import { IReportDraftSubCriterionService } from './sub-criterion/report-draft-sub-criterion.service.interface'

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
    ConfigCoreModule,
  ],
  providers: [
    {
      provide: IReportDraftService,
      useClass: ReportDraftService,
    },
    {
      provide: IReportDraftAnalysisService,
      useClass: ReportDraftAnalysisService,
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
    {
      provide: IReportDraftAssignmentService,
      useClass: ReportDraftAssignmentService,
    },
  ],
  exports: [
    IReportDraftService,
    IReportDraftAnalysisService,
    IReportDraftRoleService,
    IReportDraftEmployeeService,
    IReportDraftCriterionService,
    IReportDraftSubCriterionService,
    IReportDraftStepService,
    IReportDraftAssignmentService,
  ],
})
export class ReportDraftCoreModule {}

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { ReportModel } from '../report/models/report.model'
import { ReportCriterionModel } from '../report-criterion/models/report-criterion.model'
import { ReportEmployeeModel } from '../report-employee/models/report-employee.model'
import { ReportEmployeeRoleModel } from '../report-employee/models/report-employee-role.model'
import { ReportOutlierGroupModel } from '../report-employee/models/report-outlier-group.model'
import { ReportDraftService } from './report-draft.service'
import { IReportDraftService } from './report-draft.service.interface'
import { ReportDraftRoleService } from './report-draft-role.service'
import { IReportDraftRoleService } from './report-draft-role.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([
      ReportModel,
      ReportEmployeeModel,
      ReportEmployeeRoleModel,
      ReportCriterionModel,
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
  ],
  exports: [IReportDraftService, IReportDraftRoleService],
})
export class ReportDraftCoreModule {}

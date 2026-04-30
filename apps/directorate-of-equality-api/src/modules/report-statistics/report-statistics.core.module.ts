import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { ReportCriterionModel } from '../report-criterion/models/report-criterion.model'
import { ReportSubCriterionModel } from '../report-criterion/models/report-sub-criterion.model'
import { ReportSubCriterionStepModel } from '../report-criterion/models/report-sub-criterion-step.model'
import { ReportEmployeeModel } from '../report-employee/models/report-employee.model'
import { ReportEmployeePersonalCriterionStepModel } from '../report-employee/models/report-employee-personal-criterion-step.model'
import { ReportEmployeeRoleCriterionStepModel } from '../report-employee/models/report-employee-role-criterion-step.model'
import { ReportStatisticsService } from './report-statistics.service'
import { IReportStatisticsService } from './report-statistics.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([
      ReportEmployeeModel,
      ReportCriterionModel,
      ReportSubCriterionModel,
      ReportSubCriterionStepModel,
      ReportEmployeeRoleCriterionStepModel,
      ReportEmployeePersonalCriterionStepModel,
    ]),
  ],
  providers: [
    AdminGuard,
    {
      provide: IReportStatisticsService,
      useClass: ReportStatisticsService,
    },
  ],
  exports: [IReportStatisticsService],
})
export class ReportStatisticsCoreModule {}

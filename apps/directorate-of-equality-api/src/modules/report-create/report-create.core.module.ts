import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CompanyReportModel } from '../company/models/company-report.model'
import { ConfigCoreModule } from '../config/config.core.module'
import { ReportModel } from '../report/models/report.model'
import { ReportContentCoreModule } from '../report-content/report-content.core.module'
import { ReportEmployeeOutlierModel } from '../report-employee/models/report-employee-outlier.model'
import { ReportOutlierGroupModel } from '../report-employee/models/report-outlier-group.model'
import { ReportFinalizeCoreModule } from '../report-finalize/report-finalize.core.module'
import { ReportResultCoreModule } from '../report-result/report-result.core.module'
import { ReportCreateService } from './report-create.service'
import { IReportCreateService } from './report-create.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([
      ReportModel,
      CompanyReportModel,
      ReportEmployeeOutlierModel,
      ReportOutlierGroupModel,
    ]),
    ReportContentCoreModule,
    ReportResultCoreModule,
    ReportFinalizeCoreModule,
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

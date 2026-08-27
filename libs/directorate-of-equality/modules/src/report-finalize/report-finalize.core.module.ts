import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CompanyModel } from '../company/models/company.model'
import { CompanyReportModel } from '../company/models/company-report.model'
import { ReportModel } from '../report/models/report.model'
import { ReportEventModel } from '../report/models/report-event.model'
import { ReportAutoReviewCoreModule } from '../report-auto-review/report-auto-review.core.module'
import { ReportFinalizeService } from './report-finalize.service'
import { IReportFinalizeService } from './report-finalize.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([
      ReportModel,
      CompanyModel,
      CompanyReportModel,
      ReportEventModel,
    ]),
    ReportAutoReviewCoreModule,
  ],
  providers: [
    {
      provide: IReportFinalizeService,
      useClass: ReportFinalizeService,
    },
  ],
  exports: [IReportFinalizeService],
})
export class ReportFinalizeCoreModule {}

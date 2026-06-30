import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { ReportModel } from '../report/models/report.model'
import { ReportDraftService } from './report-draft.service'
import { IReportDraftService } from './report-draft.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([ReportModel])],
  providers: [
    {
      provide: IReportDraftService,
      useClass: ReportDraftService,
    },
  ],
  exports: [IReportDraftService],
})
export class ReportDraftCoreModule {}

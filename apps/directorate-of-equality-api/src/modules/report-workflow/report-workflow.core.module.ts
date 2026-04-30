import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CompanyReportModel } from '../company/models/company-report.model'
import { ReportModel } from '../report/models/report.model'
import { ReportEventCoreModule } from '../report-event/report-event.core.module'
import { ReportWorkflowService } from './report-workflow.service'
import { IReportWorkflowService } from './report-workflow.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([ReportModel, CompanyReportModel]),
    ReportEventCoreModule,
  ],
  providers: [
    {
      provide: IReportWorkflowService,
      useClass: ReportWorkflowService,
    },
  ],
  exports: [IReportWorkflowService],
})
export class ReportWorkflowCoreModule {}

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CompanyReportModel } from '../company/models/company-report.model'
import { ReportModel } from '../report/models/report.model'
import { ReportEventCoreModule } from '../report-event/report-event.core.module'
import { UserModel } from '../user/models/user.model'
import { ReportWorkflowService } from './report-workflow.service'
import { IReportWorkflowService } from './report-workflow.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([ReportModel, CompanyReportModel, UserModel]),
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

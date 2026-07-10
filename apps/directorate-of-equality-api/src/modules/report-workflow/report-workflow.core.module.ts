import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { ApplicationSystemCoreModule } from '../application-system/application-system.core.module'
import { CompanyModel } from '../company/models/company.model'
import { CompanyReportModel } from '../company/models/company-report.model'
import { ReportModel } from '../report/models/report.model'
import { ReportCommentCoreModule } from '../report-comment/report-comment.core.module'
import { ReportOutlierGroupModel } from '../report-employee/models/report-outlier-group.model'
import { ReportEventCoreModule } from '../report-event/report-event.core.module'
import { UserModel } from '../user/models/user.model'
import { ReportWorkflowService } from './report-workflow.service'
import { IReportWorkflowService } from './report-workflow.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([
      ReportModel,
      CompanyReportModel,
      CompanyModel,
      UserModel,
      ReportOutlierGroupModel,
    ]),
    ReportEventCoreModule,
    ApplicationSystemCoreModule,
    ReportCommentCoreModule,
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

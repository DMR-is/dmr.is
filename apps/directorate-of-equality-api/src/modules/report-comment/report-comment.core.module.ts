import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { ApplicationSystemCoreModule } from '../application-system/application-system.core.module'
import { CompanyReportModel } from '../company/models/company-report.model'
import { DoeMailModule } from '../mail/doe-mail.module'
import { ReportModel } from '../report/models/report.model'
import { ReportEventCoreModule } from '../report-event/report-event.core.module'
import { ReportCommentModel } from './models/report-comment.model'
import { ReportCommentService } from './report-comment.service'
import { IReportCommentService } from './report-comment.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([
      ReportCommentModel,
      ReportModel,
      CompanyReportModel,
    ]),
    DoeMailModule,
    ReportEventCoreModule,
    ApplicationSystemCoreModule,
  ],
  providers: [
    {
      provide: IReportCommentService,
      useClass: ReportCommentService,
    },
  ],
  exports: [IReportCommentService],
})
export class ReportCommentCoreModule {}

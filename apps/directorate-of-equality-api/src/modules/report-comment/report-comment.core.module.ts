import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { DoeMailModule } from '../mail/doe-mail.module'
import { ReportModel } from '../report/models/report.model'
import { ReportCommentModel } from './models/report-comment.model'
import { ReportCommentService } from './report-comment.service'
import { IReportCommentService } from './report-comment.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([ReportCommentModel, ReportModel]),
    DoeMailModule,
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

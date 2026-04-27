import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { ReportResourceGuard } from '../../core/guards/report-resource/report-resource.guard'
import { ReportModel } from '../report/models/report.model'
import { UserModel } from '../user/models/user.model'
import { ReportCommentModel } from './models/report-comment.model'
import { ReportCommentController } from './report-comment.controller'
import { ReportCommentService } from './report-comment.service'
import { IReportCommentService } from './report-comment.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([ReportCommentModel, ReportModel, UserModel]),
  ],
  controllers: [ReportCommentController],
  providers: [
    ReportResourceGuard,
    {
      provide: IReportCommentService,
      useClass: ReportCommentService,
    },
  ],
  exports: [IReportCommentService],
})
export class ReportCommentModule {}

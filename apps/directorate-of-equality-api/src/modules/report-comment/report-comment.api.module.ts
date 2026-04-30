import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { ReportResourceGuard } from '../../core/guards/report-resource/report-resource.guard'
import { ReportModel } from '../report/models/report.model'
import { UserModel } from '../user/models/user.model'
import { ReportCommentController } from './report-comment.controller'
import { ReportCommentCoreModule } from './report-comment.core.module'

@Module({
  imports: [
    ReportCommentCoreModule,
    SequelizeModule.forFeature([UserModel, ReportModel]),
  ],
  controllers: [ReportCommentController],
  providers: [ReportResourceGuard],
})
export class ReportCommentApiModule {}

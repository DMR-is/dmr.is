import { Module } from '@nestjs/common'

import { AuthorizationCoreModule } from '@dmr.is/doe-modules/authorization'
import { ReportCommentCoreModule } from '@dmr.is/doe-modules/report-comment'

import { ReportResourceGuard } from '../../core/guards/report-resource/report-resource.guard'
import { ReportCommentController } from './report-comment.controller'

@Module({
  imports: [ReportCommentCoreModule, AuthorizationCoreModule],
  controllers: [ReportCommentController],
  providers: [ReportResourceGuard],
})
export class ReportCommentApiModule {}

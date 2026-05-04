import { Module } from '@nestjs/common'

import { ReportResourceGuard } from '../../core/guards/report-resource/report-resource.guard'
import { AuthorizationCoreModule } from '../authorization/authorization.core.module'
import { ReportCommentController } from './report-comment.controller'
import { ReportCommentCoreModule } from './report-comment.core.module'

@Module({
  imports: [ReportCommentCoreModule, AuthorizationCoreModule],
  controllers: [ReportCommentController],
  providers: [ReportResourceGuard],
})
export class ReportCommentApiModule {}

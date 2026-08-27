import { Module } from '@nestjs/common'

import {
  AuthorizationCoreModule,
  ReportCommentCoreModule,
} from '@dmr.is/doe-modules'

import { ReportResourceGuard } from '../../core/guards/report-resource/report-resource.guard'
import { ReportCommentController } from './report-comment.controller'

@Module({
  imports: [ReportCommentCoreModule, AuthorizationCoreModule],
  controllers: [ReportCommentController],
  providers: [ReportResourceGuard],
})
export class ReportCommentApiModule {}

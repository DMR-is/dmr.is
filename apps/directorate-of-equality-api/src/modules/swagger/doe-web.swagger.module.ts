import { Module } from '@nestjs/common'

import { ConfigApiModule } from '../config/config.api.module'
import { ReportApiModule } from '../report/report.api.module'
import { ReportCommentApiModule } from '../report-comment/report-comment.api.module'
import { ReportWorkflowApiModule } from '../report-workflow/report-workflow.api.module'
import { UserApiModule } from '../user/user.api.module'

@Module({
  imports: [
    UserApiModule,
    ConfigApiModule,
    ReportApiModule,
    ReportCommentApiModule,
    ReportWorkflowApiModule,
  ],
})
export class DoeWebSwaggerModule {}

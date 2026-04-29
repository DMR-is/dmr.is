import { Module } from '@nestjs/common'

import { ConfigModule } from '../config/config.module'
import { ReportModule } from '../report/report.module'
import { ReportCommentModule } from '../report-comment/report-comment.module'
import { ReportWorkflowModule } from '../report-workflow/report-workflow.module'
import { UserModule } from '../user/user.module'

@Module({
  imports: [
    UserModule,
    ConfigModule,
    ReportModule,
    ReportCommentModule,
    ReportWorkflowModule,
  ],
})
export class DoeWebSwaggerModule {}

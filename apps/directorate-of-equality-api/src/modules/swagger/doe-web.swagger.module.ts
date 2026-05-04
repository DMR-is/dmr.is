import { Module } from '@nestjs/common'

import { AdminReportApiModule } from '../admin-report/admin-report.api.module'
import { CompanyApiModule } from '../company/company.api.module'
import { ConfigApiModule } from '../config/config.api.module'
import { ReportApiModule } from '../report/report.api.module'
import { ReportCommentApiModule } from '../report-comment/report-comment.api.module'
import { ReportWorkflowApiModule } from '../report-workflow/report-workflow.api.module'
import { UserApiModule } from '../user/user.api.module'

@Module({
  imports: [
    AdminReportApiModule,
    CompanyApiModule,
    UserApiModule,
    ConfigApiModule,
    ReportApiModule,
    ReportCommentApiModule,
    ReportWorkflowApiModule,
  ],
})
export class DoeWebSwaggerModule {}

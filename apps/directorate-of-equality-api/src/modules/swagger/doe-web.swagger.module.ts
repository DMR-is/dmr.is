import { Module } from '@nestjs/common'

import { ConfigModule } from '../config/config.module'
import { ReportModule } from '../report/report.module'
import { ReportCommentModule } from '../report-comment/report-comment.module'
import { ReportCreateModule } from '../report-create/report-create.module'
import { ReportExcelModule } from '../report-excel/report-excel.module'
import { ReportResultModule } from '../report-result/report-result.module'
import { ReportStatisticsModule } from '../report-statistics/report-statistics.module'
import { ReportWorkflowModule } from '../report-workflow/report-workflow.module'
import { UserModule } from '../user/user.module'

@Module({
  imports: [
    UserModule,
    ConfigModule,
    ReportModule,
    ReportCommentModule,
    ReportCreateModule,
    ReportExcelModule,
    ReportResultModule,
    ReportStatisticsModule,
    ReportWorkflowModule,
  ],
})
export class DoeWebSwaggerModule {}

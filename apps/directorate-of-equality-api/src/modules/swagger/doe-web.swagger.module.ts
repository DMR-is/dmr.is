import { Module } from '@nestjs/common'

import { AdminReportApiModule } from '../admin-report/admin-report.api.module'
import { CompanyApiModule } from '../company/company.api.module'
import { CompanyImportApiModule } from '../company-import/company-import.api.module'
import { ConfigApiModule } from '../config/config.api.module'
import { ImportUploadApiModule } from '../import-upload/import-upload.api.module'
import { LocationApiModule } from '../location/location.api.module'
import { ReportApiModule } from '../report/report.api.module'
import { ReportCommentApiModule } from '../report-comment/report-comment.api.module'
import { ReportPdfApiModule } from '../report-pdf/report-pdf.api.module'
import { ReportStatisticsApiModule } from '../report-statistics/report-statistics.api.module'
import { ReportWorkflowApiModule } from '../report-workflow/report-workflow.api.module'
import { UserApiModule } from '../user/user.api.module'

@Module({
  imports: [
    AdminReportApiModule,
    CompanyApiModule,
    CompanyImportApiModule,
    ImportUploadApiModule,
    UserApiModule,
    ConfigApiModule,
    LocationApiModule,
    ReportApiModule,
    ReportCommentApiModule,
    ReportWorkflowApiModule,
    ReportStatisticsApiModule,
    ReportPdfApiModule,
  ],
})
export class DoeWebSwaggerModule {}

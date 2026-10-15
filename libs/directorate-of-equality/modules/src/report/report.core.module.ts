import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CompanyModel } from '../company/models/company.model'
import { CompanyReportModel } from '../company/models/company-report.model'
import { LegacyReportModel } from '../company/models/legacy-report.model'
import { ReportCommentModel } from '../report-comment/models/report-comment.model'
import { ReportEmployeeOutlierModel } from '../report-employee/models/report-employee-outlier.model'
import { ReportOutlierGroupModel } from '../report-employee/models/report-outlier-group.model'
import { ReportModel } from './models/report.model'
import { ReportEventModel } from './models/report-event.model'
import { ReportService } from './report.service'
import { IReportService } from './report.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([
      ReportModel,
      ReportEventModel,
      ReportEmployeeOutlierModel,
      ReportOutlierGroupModel,
      ReportCommentModel,
      CompanyReportModel,
      // The retired SharePoint register. Read by `resolveEqualityCoverage`,
      // which answers whether the company's equality obligation is met from
      // either an APPROVED report or an unexpired certificate here.
      LegacyReportModel,
      // Read by `resolveSalaryFilingBasis` for the sector, which decides
      // whether a company may file a salary report with no equality coverage.
      CompanyModel,
    ]),
  ],
  providers: [
    {
      provide: IReportService,
      useClass: ReportService,
    },
  ],
  exports: [IReportService],
})
export class ReportCoreModule {}

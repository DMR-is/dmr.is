import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CompanyResourceGuard } from '../../core/guards/company-resource/company-resource.guard'
import { CompanyCoreModule } from '../company/company.core.module'
import { CompanyReportModel } from '../company/models/company-report.model'
import { ConfigCoreModule } from '../config/config.core.module'
import { ReportModel } from '../report/models/report.model'
import { ReportEventModel } from '../report/models/report-event.model'
import { ReportCoreModule } from '../report/report.core.module'
import { ReportCommentCoreModule } from '../report-comment/report-comment.core.module'
import { ReportCreateCoreModule } from '../report-create/report-create.core.module'
import { ReportEmployeeOutlierModel } from '../report-employee/models/report-employee-outlier.model'
import { ReportExcelCoreModule } from '../report-excel/report-excel.core.module'
import { ReportResultCoreModule } from '../report-result/report-result.core.module'
import { ApplicationService } from './application.service'
import { IApplicationService } from './application.service.interface'

@Module({
  imports: [
    CompanyCoreModule,
    ReportExcelCoreModule,
    ConfigCoreModule,
    ReportCoreModule,
    ReportCreateCoreModule,
    ReportCommentCoreModule,
    ReportResultCoreModule,
    SequelizeModule.forFeature([
      ReportModel,
      CompanyReportModel,
      ReportEmployeeOutlierModel,
      ReportEventModel,
    ]),
  ],
  providers: [
    {
      provide: IApplicationService,
      useClass: ApplicationService,
    },
  ],
  exports: [IApplicationService],
})
export class ApplicationCoreModule {}

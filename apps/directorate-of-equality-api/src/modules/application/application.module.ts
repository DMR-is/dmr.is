import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CompanyModule } from '../company/company.module'
import { CompanyReportModel } from '../company/models/company-report.model'
import { ConfigModule } from '../config/config.module'
import { ReportModel } from '../report/models/report.model'
import { ReportEventModel } from '../report/models/report-event.model'
import { ReportModule } from '../report/report.module'
import { ReportCommentModule } from '../report-comment/report-comment.module'
import { ReportCreateModule } from '../report-create/report-create.module'
import { ReportEmployeeOutlierModel } from '../report-employee/models/report-employee-outlier.model'
import { ReportExcelModule } from '../report-excel/report-excel.module'
import { ReportResultModule } from '../report-result/report-result.module'
import { ApplicationController } from './application.controller'
import { ApplicationService } from './application.service'
import { IApplicationService } from './application.service.interface'
import { CompanyResourceGuard } from './company-resource.guard'

@Module({
  imports: [
    CompanyModule,
    ReportExcelModule,
    ConfigModule,
    ReportModule,
    ReportCreateModule,
    ReportCommentModule,
    ReportResultModule,
    SequelizeModule.forFeature([
      ReportModel,
      CompanyReportModel,
      ReportEmployeeOutlierModel,
      ReportEventModel,
    ]),
  ],
  controllers: [ApplicationController],
  providers: [
    CompanyResourceGuard,
    {
      provide: IApplicationService,
      useClass: ApplicationService,
    },
  ],
})
export class ApplicationModule {}

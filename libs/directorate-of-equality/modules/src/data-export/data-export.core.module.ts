import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CompanyCoreModule } from '../company/company.core.module'
import { CompanyReportModel } from '../company/models/company-report.model'
import { IsatCategoryModel } from '../company/models/isat-category.model'
import { PostcodeModel } from '../location/models/postcode.model'
import { RegionModel } from '../location/models/region.model'
import { ReportModel } from '../report/models/report.model'
import { ReportEmployeeModel } from '../report-employee/models/report-employee.model'
import { ReportEmployeeOutlierModel } from '../report-employee/models/report-employee-outlier.model'
import { ReportResultModel } from '../report-result/models/report-result.model'
import { DataExportService } from './data-export.service'
import { IDataExportService } from './data-export.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([
      ReportModel,
      ReportResultModel,
      ReportEmployeeModel,
      ReportEmployeeOutlierModel,
      CompanyReportModel,
      PostcodeModel,
      RegionModel,
      IsatCategoryModel,
    ]),
    // The export deliberately reads companies THROUGH the company service
    // rather than through its own query, so the rows it writes are the rows
    // the register list would have shown for the same filter.
    CompanyCoreModule,
  ],
  providers: [
    {
      provide: IDataExportService,
      useClass: DataExportService,
    },
  ],
  exports: [IDataExportService],
})
export class DataExportCoreModule {}

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CompanyModel } from '../company/models/company.model'
import { CompanyReportModel } from '../company/models/company-report.model'
import { PostcodeModel } from '../location/models/postcode.model'
import { RegionModel } from '../location/models/region.model'
import { ReportModel } from '../report/models/report.model'
import { AggregateStatisticsService } from './aggregate-statistics.service'
import { IAggregateStatisticsService } from './aggregate-statistics.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([
      CompanyModel,
      ReportModel,
      CompanyReportModel,
      PostcodeModel,
      RegionModel,
    ]),
  ],
  providers: [
    {
      provide: IAggregateStatisticsService,
      useClass: AggregateStatisticsService,
    },
  ],
  exports: [IAggregateStatisticsService],
})
export class AggregateStatisticsCoreModule {}

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CompanyModel } from '../company/models/company.model'
import { PostcodeModel } from '../location/models/postcode.model'
import { RegionModel } from '../location/models/region.model'
import { AggregateStatisticsService } from './aggregate-statistics.service'
import { IAggregateStatisticsService } from './aggregate-statistics.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([CompanyModel, PostcodeModel, RegionModel]),
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

import { Module } from '@nestjs/common'

import { AggregateStatisticsCoreModule } from '@dmr.is/doe-modules/aggregate-statistics'

import { AggregateStatisticsController } from './aggregate-statistics.controller'

@Module({
  imports: [AggregateStatisticsCoreModule],
  controllers: [AggregateStatisticsController],
})
export class AggregateStatisticsApiModule {}

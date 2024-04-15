import { LoggingModule } from '@dmr.is/logging'

import { Module } from '@nestjs/common'

import { StatisticsController } from './statistics.controller'
import { StatisticsService } from './statistics.service'
import { IStatisticsService } from './statistics.service.interface'
import { MockStatisticsService } from './statistics.service.mock'

const MOCK_DATA = true

@Module({
  imports: [LoggingModule],
  controllers: [StatisticsController],
  providers: [
    {
      provide: IStatisticsService,
      useClass: MOCK_DATA ? MockStatisticsService : StatisticsService,
    },
  ],
})
export class StatisticsModule {}

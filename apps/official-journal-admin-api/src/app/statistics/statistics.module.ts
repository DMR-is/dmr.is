import { LoggingModule } from '@dmr.is/logging'
import { SharedCaseModule } from '@dmr.is/modules'

import { Module } from '@nestjs/common'

import { StatisticsController } from './statistics.controller'
import { StatisticsService } from './statistics.service'
import { IStatisticsService } from './statistics.service.interface'
import { MockStatisticsService } from './statistics.service.mock'

const MOCK_DATA = process.env.API_MOCK === 'true'

@Module({
  imports: [LoggingModule, SharedCaseModule],
  controllers: [StatisticsController],
  providers: [
    {
      provide: IStatisticsService,
      useClass: MOCK_DATA ? MockStatisticsService : StatisticsService,
    },
  ],
})
export class StatisticsModule {}

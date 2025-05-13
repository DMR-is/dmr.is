import { LoggingModule } from '@dmr.is/logging'
import { CaseModel, UserModule } from '@dmr.is/modules'
import { createRedisCacheOptions } from '@dmr.is/utils/cache'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { StatisticsController } from './statistics.controller'
import { StatisticsService } from './statistics.service'
import { IStatisticsService } from './statistics.service.interface'
import { MockStatisticsService } from './statistics.service.mock'
const MOCK_DATA = process.env.API_MOCK === 'true'

@Module({
  imports: [
    createRedisCacheOptions('ojoi-statistics'),
    SequelizeModule.forFeature([CaseModel]), LoggingModule, UserModule],
  controllers: [StatisticsController],
  providers: [
    {
      provide: IStatisticsService,
      useClass: MOCK_DATA ? MockStatisticsService : StatisticsService,
    },
  ],
})
export class StatisticsModule {}

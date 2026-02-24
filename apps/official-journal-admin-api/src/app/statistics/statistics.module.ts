import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { LoggingModule } from '@dmr.is/logging'
import { CaseModel, UserModule } from '@dmr.is/ojoi-modules'

import { StatisticsController } from './statistics.controller'
import { StatisticsService } from './statistics.service'
import { IStatisticsService } from './statistics.service.interface'
import { MockStatisticsService } from './statistics.service.mock'
const MOCK_DATA = process.env.API_MOCK === 'true'

@Module({
  imports: [SequelizeModule.forFeature([CaseModel]), LoggingModule, UserModule],
  controllers: [StatisticsController],
  providers: [
    {
      provide: IStatisticsService,
      useClass: MOCK_DATA ? MockStatisticsService : StatisticsService,
    },
  ],
})
export class StatisticsModule {}

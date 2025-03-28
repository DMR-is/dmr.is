import { CaseModel } from '@dmr.is/official-journal/models'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { StatisticsController } from './statistics.controller'
import { StatisticsService } from './statistics.service'
import { IStatisticsService } from './statistics.service.interface'
import { MockStatisticsService } from './statistics.service.mock'

const MOCK_DATA = process.env.API_MOCK === 'true'

@Module({
  imports: [SequelizeModule.forFeature([CaseModel])],
  controllers: [StatisticsController],
  providers: [
    {
      provide: IStatisticsService,
      useClass: MOCK_DATA ? MockStatisticsService : StatisticsService,
    },
  ],
})
export class StatisticsModule {}

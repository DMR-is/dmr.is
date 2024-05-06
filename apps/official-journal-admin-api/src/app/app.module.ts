import { SequelizeConfigService } from '@dmr.is/db'
import {
  ApplicationModule,
  HealthController,
  SharedJournalModule,
} from '@dmr.is/modules'

import { Module } from '@nestjs/common'
import { RouterModule } from '@nestjs/core'
import { SequelizeModule } from '@nestjs/sequelize'

import { CaseModule } from './case/case.module'
import { StatisticsModule } from './statistics/statistics.module'

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      useClass: SequelizeConfigService,
    }),
    ApplicationModule,
    CaseModule,
    StatisticsModule,
    SharedJournalModule,
    RouterModule.register([
      {
        path: 'cases',
        module: CaseModule,
      },
      {
        path: 'statistics',
        module: StatisticsModule,
      },
      {
        path: 'journal',
        module: SharedJournalModule,
      },
    ]),
  ],
  controllers: [HealthController],
})
export class AppModule {}

import { SequelizeConfigService } from '@dmr.is/db'
import {
  ApplicationModule,
  HealthModule,
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
    HealthModule,
    RouterModule.register([
      {
        path: '/',
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
})
export class AppModule {}

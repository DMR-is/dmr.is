import { JournalModule } from '@dmr.is/modules'

import { Module } from '@nestjs/common'
import { RouterModule } from '@nestjs/core'

import { CaseModule } from './case/case.module'
import { HealthModule } from './health/health.module'
import { StatisticsModule } from './statistics/statistics.module'

@Module({
  imports: [
    CaseModule,
    HealthModule,
    StatisticsModule,
    JournalModule,
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
        path: 'health',
        module: HealthModule,
      },
      {
        path: 'journal',
        module: JournalModule,
      },
    ]),
  ],
})
export class AppModule {}

import { ApplicationModule, JournalModule } from '@dmr.is/modules'

import { Module } from '@nestjs/common'
import { RouterModule } from '@nestjs/core'

import { CaseModule } from './case/case.module'
import { StatisticsModule } from './statistics/statistics.module'

@Module({
  imports: [
    ApplicationModule,
    CaseModule,
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
        path: 'journal',
        module: JournalModule,
      },
    ]),
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common'
import { JournalModule } from './journal/journal.module'
import { RouterModule } from '@nestjs/core'
import { StatisticsModule } from './statistics/statistics.module'
import { CaseModule } from './case/case.module'

@Module({
  imports: [
    JournalModule,
    StatisticsModule,
    CaseModule,
    RouterModule.register([
      {
        path: 'journal',
        module: JournalModule,
      },
      {
        path: 'statistics',
        module: StatisticsModule,
      },
      {
        path: 'cases',
        module: CaseModule,
      },
    ]),
  ],
})
export class AppModule {}

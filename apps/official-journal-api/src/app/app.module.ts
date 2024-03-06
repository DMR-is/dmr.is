import { Module } from '@nestjs/common'
import { JournalModule } from './journal/journal.module'
import { RouterModule } from '@nestjs/core'
import { StatisticsModule } from './statistics/statistics.module'

@Module({
  imports: [
    JournalModule,
    StatisticsModule,
    RouterModule.register([
      {
        path: 'journal',
        module: JournalModule,
      },
      {
        path: 'statistics',
        module: StatisticsModule,
      },
    ]),
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common'
import { RouterModule } from '@nestjs/core'
import { CaseModule } from './case/case.module'
import { StatisticsModule } from './statistics/statistics.module'

@Module({
  imports: [
    CaseModule,
    StatisticsModule,
    RouterModule.register([
      {
        path: 'cases',
        module: CaseModule,
      },
      {
        path: 'statistics',
        module: StatisticsModule,
      },
    ]),
  ],
})
export class AppModule {}

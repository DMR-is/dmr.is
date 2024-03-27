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
    ]),
  ],
})
export class AppModule {}

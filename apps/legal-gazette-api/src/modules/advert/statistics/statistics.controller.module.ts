import { Module } from '@nestjs/common'

import { StatisticsController } from './statistics.controller'
import { StatisticsProviderModule } from './statistics.provider.module'

@Module({
  imports: [StatisticsProviderModule],
  controllers: [StatisticsController],
})
export class StatisticsControllerModule {}

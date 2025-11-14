import { Module } from '@nestjs/common'

import { SettlementController } from './settlement.controller'
import { SettlementProviderModule } from './settlement.provider.module'

@Module({
  imports: [SettlementProviderModule],
  controllers: [SettlementController],
})
export class SettlementControllerModule {}

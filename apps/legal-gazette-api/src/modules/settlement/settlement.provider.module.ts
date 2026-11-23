import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { SettlementModel } from '../../models/settlement.model'
import { SettlementService } from './settlement.service'
import { ISettlementService } from './settlement.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([SettlementModel])],
  providers: [
    {
      provide: ISettlementService,
      useClass: SettlementService,
    },
  ],
  exports: [ISettlementService],
})
export class SettlementProviderModule {}

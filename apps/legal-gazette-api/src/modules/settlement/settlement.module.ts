import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { SettlementController } from './settlement.controller'
import { SettlementModel } from './settlement.model'
import { SettlementService } from './settlement.service'
import { ISettlementService } from './settlement.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([SettlementModel])],
  controllers: [SettlementController],
  providers: [
    {
      provide: ISettlementService,
      useClass: SettlementService,
    },
  ],
  exports: [ISettlementService],
})
export class SettlementModule {}

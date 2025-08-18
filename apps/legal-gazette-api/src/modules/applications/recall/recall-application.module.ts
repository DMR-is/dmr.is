import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertModel } from '../../advert/advert.model'
import { CaseModel } from '../../case/case.model'
import { SettlementModel } from '../../settlement/settlement.model'
import { RecallApplicationController } from './recall-application.controller'
import { RecallApplicationModel } from './recall-application.model'

@Module({
  imports: [
    SequelizeModule.forFeature([
      RecallApplicationModel,
      CaseModel,
      AdvertModel,
      SettlementModel,
    ]),
  ],
  controllers: [RecallApplicationController],
  providers: [],
  exports: [],
})
export class BankruptcyApplicationModule {}

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertModel } from '../../advert/advert.model'
import { BankruptcyAdvertModel } from '../../bankruptcy/advert/bankruptcy-advert.model'
import { BankruptcyDivisionAdvertModel } from '../../bankruptcy/division-advert/bankruptcy-division-advert.model'
import { CaseModel } from '../../case/case.model'
import { SettlementModel } from '../../settlement/settlement.model'
import { BankruptcyApplicationController } from './bankruptcy-application.controller'
import { BankruptcyApplicationModel } from './bankruptcy-application.model'

@Module({
  imports: [
    SequelizeModule.forFeature([
      BankruptcyApplicationModel,
      CaseModel,
      AdvertModel,
      BankruptcyAdvertModel,
      BankruptcyDivisionAdvertModel,
      SettlementModel,
    ]),
  ],
  controllers: [BankruptcyApplicationController],
  providers: [],
  exports: [],
})
export class BankruptcyApplicationModule {}

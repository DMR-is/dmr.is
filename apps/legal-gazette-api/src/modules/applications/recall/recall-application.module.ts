import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertModel } from '../../advert/advert.model'
import { DivisionMeetingAdvertDto } from '../../advert/division/dto/division.dto'
import { DivisionEndingAdvertModel } from '../../advert/division/models/division-ending-advert.model'
import { RecallAdvertModel } from '../../advert/recall/recall-advert.model'
import { CaseModel } from '../../case/case.model'
import { SettlementModel } from '../../settlement/settlement.model'
import { BankruptcyApplicationController } from './recall-application.controller'
import { RecallApplicationModel } from './recall-application.model'

@Module({
  imports: [
    SequelizeModule.forFeature([
      RecallApplicationModel,
      CaseModel,
      AdvertModel,
      RecallAdvertModel,
      DivisionMeetingAdvertDto,
      DivisionEndingAdvertModel,
      SettlementModel,
    ]),
  ],
  controllers: [BankruptcyApplicationController],
  providers: [],
  exports: [],
})
export class BankruptcyApplicationModule {}

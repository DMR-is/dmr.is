import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { ApplicationModel } from '../../models/application.model'
import { PriceCalculatorProviderModule } from '../advert/calculator/price-calculator.provider.module'
import { RecallApplicationController } from './recall/recall-application.controller'
import { RecallApplicationProviderModule } from './recall/recall-application.provider.module'
import { ApplicationController } from './application.controller'
import { ApplicationProviderModule } from './application.provider.module'
@Module({
  imports: [
    RecallApplicationProviderModule,
    ApplicationProviderModule,
    PriceCalculatorProviderModule,
    SequelizeModule.forFeature([ApplicationModel]),
  ],
  controllers: [RecallApplicationController, ApplicationController],
  exports: [],
})
export class ApplictionControllerModule {}

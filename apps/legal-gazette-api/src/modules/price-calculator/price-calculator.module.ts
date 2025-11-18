/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertModel } from '../../models/advert.model'
import { PriceCalculatorService } from './price-calculator.service'
import { IPriceCalculatorService } from './price-calculator.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([AdvertModel])],
  providers: [
    {
      provide: IPriceCalculatorService,
      useClass: PriceCalculatorService,
    },
  ],
  exports: [IPriceCalculatorService],
})
export class PriceCalculatorModule {}

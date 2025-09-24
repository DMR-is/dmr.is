/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertModel } from '../advert/advert.model'
import { TBRModule } from '../tbr/tbr.module'
import { PriceCalculatorService } from './price-calculator.service'
import { IPriceCalculatorService } from './price-calculator.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([AdvertModel]),
    TBRModule.forRoot({
      chargeCategory: process.env.LG_TBR_CHARGE_CATEGORY!,
      credentials: process.env.LG_TBR_CREDENTIALS!,
      officeId: process.env.LG_TBR_OFFICE_ID!,
      tbrPath: process.env.LG_TBR_PATH!,
    }),
  ],
  providers: [
    {
      provide: IPriceCalculatorService,
      useClass: PriceCalculatorService,
    },
  ],
  exports: [IPriceCalculatorService],
})
export class PriceCalculatorModule {}

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertModel } from '../advert/advert.model'
import { TBRModule } from '../tbr/tbr.module'

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
})
export class PriceCalculatorModule {}

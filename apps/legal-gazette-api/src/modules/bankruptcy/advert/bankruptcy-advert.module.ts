import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertModel } from '../../advert/advert.model'
import { BankruptcyAdvertModel } from './bankruptcy-advert.model'
import { BankruptcyLocationModel } from './models/bankruptcy-location.model'
import { BankruptcyAdvertController } from './bankruptcy-advert.controller'

@Module({
  imports: [
    SequelizeModule.forFeature([
      AdvertModel,
      BankruptcyAdvertModel,
      BankruptcyLocationModel,
    ]),
  ],
  controllers: [BankruptcyAdvertController],
  providers: [],
  exports: [],
})
export class BankruptcyAdvertModule {}

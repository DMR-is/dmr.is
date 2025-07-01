import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { BankruptcyAdvertModel } from './models/bankruptcy-advert.model'
import { BankruptcyLocationModel } from './models/bankruptcy-location.model'

@Module({
  imports: [
    SequelizeModule.forFeature([
      BankruptcyAdvertModel,
      BankruptcyLocationModel,
    ]),
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class BankruptcyAdvertModule {}

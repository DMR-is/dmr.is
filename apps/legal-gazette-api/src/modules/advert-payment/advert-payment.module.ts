import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { TBRModule } from '../tbr/tbr.module'
import { TBRTransactionModel } from '../tbr-transaction/tbr-transactions.model'
import { AdvertPaymentService } from './advert-payment.service'

@Module({
  imports: [
    SequelizeModule.forFeature([TBRTransactionModel]),
    TBRModule.forRoot({
      credentials: process.env.LG_TBR_CREDENTIALS!,
      officeId: process.env.LG_TBR_OFFICE_ID!,
      tbrBasePath: process.env.LG_TBR_PATH!,
    }),
  ],
  providers: [AdvertPaymentService],
  exports: [AdvertPaymentService],
})
export class AdvertPaymentModule {}

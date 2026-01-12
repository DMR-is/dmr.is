import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertModel } from '../../../../models/advert.model'
import { TBRTransactionModel } from '../../../../models/tbr-transactions.model'
import { TBRModule } from '../../../tbr/tbr.module'
import { PriceCalculatorProviderModule } from '../../calculator/price-calculator.provider.module'
import { PgAdvisoryLockModule } from '../lock.module'
import { PaymentTaskService } from './payment.task'
import { IPaymentTaskService } from './payment.task.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([TBRTransactionModel, AdvertModel]),
    PriceCalculatorProviderModule,
    TBRModule.forRoot({
      credentials: process.env.LG_TBR_CREDENTIALS!,
      officeId: process.env.LG_TBR_OFFICE_ID!,
      tbrBasePath: process.env.LG_TBR_PATH!,
    }),
    PgAdvisoryLockModule,
  ],
  providers: [
    {
      provide: IPaymentTaskService,
      useClass: PaymentTaskService,
    },
  ],
  exports: [IPaymentTaskService],
})
export class PaymentTaskModule {}

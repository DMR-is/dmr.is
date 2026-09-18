import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertModel } from '../../../../models/advert.model'
import { TBRTransactionModel } from '../../../../models/tbr-transactions.model'
import { TBRSharedModule } from '../../../tbr/tbr.shared-module'
import { PriceCalculatorProviderModule } from '../../calculator/price-calculator.provider.module'
import { PgAdvisoryLockModule } from '../lock.module'
import { PaymentTaskService } from './payment.task'
import { IPaymentTaskService } from './payment.task.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([TBRTransactionModel, AdvertModel]),
    PriceCalculatorProviderModule,
    TBRSharedModule,
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

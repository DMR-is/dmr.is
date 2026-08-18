import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { FeeCodeModel } from '../../models/fee-code.model'
import { SubscriberModel } from '../../models/subscriber.model'
import { SubscriberTransactionModel } from '../../models/subscriber-transaction.model'
import { TBRTransactionModel } from '../../models/tbr-transactions.model'
import { PriceCalculatorProviderModule } from '../advert/calculator/price-calculator.provider.module'
import { PgAdvisoryLockModule } from '../advert/tasks/lock.module'
import { TBRSharedModule } from '../tbr/tbr.shared-module'
import { SubscriberCreatedListener } from './listeners/subscriber-created.listener'
import { SubscriberService } from './subscriber.service'
import { ISubscriberService } from './subscriber.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([
      SubscriberModel,
      SubscriberTransactionModel,
      TBRTransactionModel,
      FeeCodeModel,
    ]),
    PriceCalculatorProviderModule,
    PgAdvisoryLockModule,
    TBRSharedModule,
  ],
  controllers: [],
  providers: [
    SubscriberCreatedListener,
    {
      provide: ISubscriberService,
      useClass: SubscriberService,
    },
  ],
  exports: [ISubscriberService],
})
export class SubscriberProviderModule {}

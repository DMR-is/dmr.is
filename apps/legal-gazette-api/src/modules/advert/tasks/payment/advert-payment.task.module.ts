import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { TBRTransactionModel } from '../../../../models/tbr-transactions.model'
import { TBRModule } from '../../../tbr/tbr.module'
import { PgAdvisoryLockModule } from '../lock.module'
import { AdvertPaymentTaskService } from './advert-payment.task'
import { IAdvertPaymentTaskService } from './advert-payment.task.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([TBRTransactionModel]),
    TBRModule.forRoot({
      credentials: process.env.LG_TBR_CREDENTIALS!,
      officeId: process.env.LG_TBR_OFFICE_ID!,
      tbrBasePath: process.env.LG_TBR_PATH!,
    }),
    PgAdvisoryLockModule,
  ],
  providers: [
    {
      provide: IAdvertPaymentTaskService,
      useClass: AdvertPaymentTaskService,
    },
  ],
  exports: [IAdvertPaymentTaskService],
})
export class AdvertPaymentTaskModule {}

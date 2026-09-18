import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { TBRTransactionModel } from '../../models/tbr-transactions.model'
import { TBRSharedModule } from '../tbr/tbr.shared-module'
import { PaymentsService } from './payments.service'
import { IPaymentsService } from './payments.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([TBRTransactionModel]), TBRSharedModule],
  providers: [
    {
      provide: IPaymentsService,
      useClass: PaymentsService,
    },
  ],
  exports: [IPaymentsService],
})
export class PaymentsProviderModule {}

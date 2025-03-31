import {
  CaseModel,
  CaseTransactionModel,
} from '@dmr.is/official-journal/models'
import { PriceModule } from '@dmr.is/official-journal/modules/price'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CasePaymentService } from './payment.service'
import { ICasePaymentService } from './payment.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([CaseModel, CaseTransactionModel]),
    PriceModule,
  ],
  controllers: [],
  providers: [
    {
      provide: ICasePaymentService,
      useClass: CasePaymentService,
    },
  ],
  exports: [ICasePaymentService],
})
export class PaymentModule {}

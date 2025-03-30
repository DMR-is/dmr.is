import { PriceModule } from '@dmr.is/official-journal/modules/price'

import { Module } from '@nestjs/common'

import { CasePaymentService } from './payment.service'
import { ICasePaymentService } from './payment.service.interface'

@Module({
  imports: [PriceModule],
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

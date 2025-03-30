import { Controller, Inject } from '@nestjs/common'

import { ICasePaymentService } from './payment.service.interface'

@Controller('payment')
export class PaymentController {
  constructor(
    @Inject(ICasePaymentService)
    private readonly paymentService: ICasePaymentService,
  ) {}

  async postExternalPaymentByCaseId(caseId: string): Promise<any> {
    return this.paymentService.postExternalPaymentByCaseId(caseId)
  }
}

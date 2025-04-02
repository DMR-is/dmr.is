import { GetPaymentResponse } from '@dmr.is/official-journal/modules/price'
import { UUIDValidationPipe } from '@dmr.is/pipelines'
import { ResultWrapper } from '@dmr.is/types'

import { Controller, Get, Inject, Param } from '@nestjs/common'
import { ApiOperation, ApiResponse } from '@nestjs/swagger'

import { ICasePaymentService } from './payment.service.interface'

@Controller('payment')
export class PaymentController {
  constructor(
    @Inject(ICasePaymentService)
    private readonly paymentService: ICasePaymentService,
  ) {}

  @Get(':id/price/payment-status')
  @ApiOperation({ operationId: 'getCasePaymentStatus' })
  @ApiResponse({ status: 200, type: GetPaymentResponse })
  async getCasePaymentStatus(
    @Param('id', new UUIDValidationPipe()) caseId: string,
  ): Promise<GetPaymentResponse> {
    return ResultWrapper.unwrap(
      await this.paymentService.getExternalPaymentStatusByCaseId(caseId),
    )
  }
}

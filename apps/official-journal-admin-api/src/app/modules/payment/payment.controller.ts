import { UserRoleEnum } from '@dmr.is/constants'
import { Roles } from '@dmr.is/decorators'
import { TokenJwtAuthGuard } from '@dmr.is/official-journal/guards'
import { GetPaymentResponse } from '@dmr.is/official-journal/modules/price'
import { RoleGuard } from '@dmr.is/official-journal/modules/user'
import { UUIDValidationPipe } from '@dmr.is/pipelines'
import { ResultWrapper } from '@dmr.is/types'

import { Controller, Get, Inject, Param, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'

import { ICasePaymentService } from './payment.service.interface'
@Controller({
  path: 'payment',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, RoleGuard)
@Roles(UserRoleEnum.Admin, UserRoleEnum.Editor)
export class PaymentController {
  constructor(
    @Inject(ICasePaymentService)
    private readonly paymentService: ICasePaymentService,
  ) {}

  @Get(':caseId/price/payment-status')
  @ApiOperation({ operationId: 'getCasePaymentStatus' })
  @ApiResponse({ status: 200, type: GetPaymentResponse })
  async getCasePaymentStatus(
    @Param('caseId', new UUIDValidationPipe()) caseId: string,
  ): Promise<GetPaymentResponse> {
    return ResultWrapper.unwrap(
      await this.paymentService.getExternalPaymentStatusByCaseId(caseId),
    )
  }
}

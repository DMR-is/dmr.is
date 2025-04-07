import { UserRoleEnum } from '@dmr.is/constants'
import { Roles } from '@dmr.is/decorators'
import { GetPaymentResponse } from '@dmr.is/official-journal/modules/price'
import { RoleGuard } from '@dmr.is/official-journal/modules/user'
import { UUIDValidationPipe } from '@dmr.is/pipelines'
import { TokenJwtAuthGuard } from '@dmr.is/shared/guards/token-auth.guard'
import { ResultWrapper } from '@dmr.is/types'

import { Body, Controller, Get, Inject, Param, Put, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'

import { UpdateCasePriceBody } from '../case/dto/update-price-body.dto'
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
  @Put(':caseId/payment')
  @ApiOperation({ operationId: 'updateCasePayment' })
  @ApiResponse({ status: 204, description: 'No content' })
  async updateCasePayment(
    @Param('caseId', new UUIDValidationPipe()) caseId: string,
    @Body() body: UpdateCasePriceBody,
  ): Promise<void> {
    await this.paymentService.updateCasePriceByCaseId(caseId, body)
  }


}

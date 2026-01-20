import { Controller, Get, Inject, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/modules/guards/auth'

import { AdminAccess, LGResponse } from '../../core/decorators'
import {
  GetPaymentsDto,
  GetPaymentsQuery,
  SyncPaymentsResponseDto,
} from '../../core/dto/payments.dto'
import { AuthorizationGuard } from '../../core/guards'
import { IPaymentsService } from './payments.service.interface'

@Controller({
  path: '/payments',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
@AdminAccess()
export class PaymentsController {
  constructor(
    @Inject(IPaymentsService)
    private readonly paymentsService: IPaymentsService,
  ) {}

  @Get('')
  @LGResponse({ operationId: 'getPaymentsList', type: GetPaymentsDto })
  async getPaymentsList(
    @Query() query: GetPaymentsQuery,
  ): Promise<GetPaymentsDto> {
    return this.paymentsService.getPayments(query)
  }

  @Post('sync')
  @LGResponse({ operationId: 'syncPayments', type: SyncPaymentsResponseDto })
  async syncPayments(): Promise<SyncPaymentsResponseDto> {
    return this.paymentsService.syncPayments()
  }
}

import {
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/ojoi/modules/guards/auth'

import { AdminAccess, LGResponse } from '../../core/decorators'
import {
  GetPaymentsDto,
  GetPaymentsQuery,
  SyncPaymentsResponseDto,
} from '../../core/dto/payments.dto'
import { AuthorizationGuard } from '../../core/guards'
import { TBRGetPaymentResponseDto } from '../tbr/tbr.dto'
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

  @Get(':transactionId')
  @LGResponse({
    operationId: 'getPaymentByTransactionId',
    type: TBRGetPaymentResponseDto,
  })
  async getPaymentByTransactionId(
    @Param('transactionId') transactionId: string,
  ): Promise<TBRGetPaymentResponseDto> {
    return this.paymentsService.getPaymentByTransactionId(transactionId)
  }

  @Post('sync')
  @LGResponse({ operationId: 'syncPayments', type: SyncPaymentsResponseDto })
  async syncPayments(): Promise<SyncPaymentsResponseDto> {
    return this.paymentsService.syncPayments()
  }
}

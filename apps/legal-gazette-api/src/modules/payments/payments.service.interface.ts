import {
  GetPaymentsDto,
  GetPaymentsQuery,
  SyncPaymentsResponseDto,
} from '../../modules/payments/dto/payments.dto'
import { TBRGetPaymentResponseDto } from '../tbr/dto/tbr.dto'

export interface IPaymentsService {
  getPayments(query: GetPaymentsQuery): Promise<GetPaymentsDto>

  getPaymentByTransactionId(
    transactionId: string,
  ): Promise<TBRGetPaymentResponseDto>

  syncPayments(): Promise<SyncPaymentsResponseDto>
}

export const IPaymentsService = Symbol('IPaymentsService')

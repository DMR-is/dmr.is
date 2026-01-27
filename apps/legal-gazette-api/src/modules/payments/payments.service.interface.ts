import {
  GetPaymentsDto,
  GetPaymentsQuery,
  SyncPaymentsResponseDto,
} from '../../core/dto/payments.dto'
import { TBRGetPaymentResponseDto } from '../tbr/tbr.dto'

export interface IPaymentsService {
  getPayments(query: GetPaymentsQuery): Promise<GetPaymentsDto>

  getPaymentByTransactionId(
    transactionId: string,
  ): Promise<TBRGetPaymentResponseDto>

  syncPayments(): Promise<SyncPaymentsResponseDto>
}

export const IPaymentsService = Symbol('IPaymentsService')

import {
  GetPaymentsDto,
  GetPaymentsQuery,
  SyncPaymentsResponseDto,
} from '../../core/dto/payments.dto'

export interface IPaymentsService {
  getPayments(query: GetPaymentsQuery): Promise<GetPaymentsDto>

  getPaymentByTransactionId(transactionId: string): Promise<void>

  syncPayments(): Promise<SyncPaymentsResponseDto>
}

export const IPaymentsService = Symbol('IPaymentsService')

import { GetPaymentsDto, GetPaymentsQuery } from '../../core/dto/payments.dto'

export interface IPaymentsService {
  getPayments(query: GetPaymentsQuery): Promise<GetPaymentsDto>

  getPaymentByTransactionId(transactionId: string): Promise<void>
}

export const IPaymentsService = Symbol('IPaymentsService')

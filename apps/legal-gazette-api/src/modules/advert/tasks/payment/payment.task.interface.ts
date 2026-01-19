export interface IPaymentTaskService {
  updateTBRPayments(): Promise<void>
}

export const IPaymentTaskService = Symbol('IPaymentTaskService')

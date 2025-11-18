export interface IAdvertPaymentTaskService {
  updateTBRPayments(): Promise<void>
}

export const IAdvertPaymentTaskService = Symbol('IAdvertPaymentTaskService')

export interface IPaymentTaskService {
  updateCreatedTBRPayments(): Promise<void>
}

export const IPaymentTaskService = Symbol('IPaymentTaskService')

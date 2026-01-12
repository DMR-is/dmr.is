export interface IPaymentTaskService {
  updateCreatedTBRPayments(): Promise<void>
  updateFailedTBRPayments(): Promise<void>
}

export const IPaymentTaskService = Symbol('IPaymentTaskService')

export interface ITBRService {
  postExternalPayment(): Promise<void>
}

export const ITBRService = Symbol('ITBRService')

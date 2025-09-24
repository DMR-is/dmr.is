import { TBRPostPaymentBodyDto } from '../tbr/dto/tbr.dto'

export interface IPriceCalculatorService {
  getPaymentData(advertId: string): Promise<TBRPostPaymentBodyDto>
}

export const IPriceCalculatorService = Symbol('IPriceCalculatorService')

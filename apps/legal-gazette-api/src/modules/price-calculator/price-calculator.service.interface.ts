import { GetPaymentDataResponseDto } from './dto/price-calculator.dto'

type NewType = Promise<GetPaymentDataResponseDto>

export interface IPriceCalculatorService {
  getPaymentData(advertId: string): NewType
}

export const IPriceCalculatorService = Symbol('IPriceCalculatorService')

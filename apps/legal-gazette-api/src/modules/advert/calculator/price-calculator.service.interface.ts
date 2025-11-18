import { GetPaymentDataResponseDto } from '../../tbr/tbr.dto'

type NewType = Promise<GetPaymentDataResponseDto>

export interface IPriceCalculatorService {
  getPaymentData(advertId: string): NewType
}

export const IPriceCalculatorService = Symbol('IPriceCalculatorService')

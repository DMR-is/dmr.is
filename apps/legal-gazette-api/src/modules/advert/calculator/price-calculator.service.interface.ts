import { GetPaymentDataResponseDto } from '../../tbr/tbr.dto'

export interface IPriceCalculatorService {
  getPaymentData(advertId: string): Promise<GetPaymentDataResponseDto>

  getEstimatedPriceForApplication(applicationId: string): Promise<number>
}

export const IPriceCalculatorService = Symbol('IPriceCalculatorService')

import { GetPaymentDataResponseDto } from '../../tbr/tbr.dto'

export interface IPriceCalculatorService {
  getPaymentData(advertId: string): Promise<GetPaymentDataResponseDto>

  getEstimatedPriceForApplication(applicationId: string): Promise<number>

  getChargeCategory(nationalId: string): Promise<string>
}

export const IPriceCalculatorService = Symbol('IPriceCalculatorService')

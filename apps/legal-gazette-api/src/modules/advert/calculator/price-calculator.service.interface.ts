import { GetApplicationAdvertPriceDto } from '../../applications/dto/application-extra.dto'
import { GetPaymentDataResponseDto } from '../../tbr/dto/tbr.dto'

export interface IPriceCalculatorService {
  getPaymentData(advertId: string): Promise<GetPaymentDataResponseDto>

  getEstimatedPriceForApplication(applicationId: string): Promise<number>
  getEstimatedPrice(advertId: string): Promise<number>
  getApplicationAdvertPrice(
    applicationId: string,
  ): Promise<GetApplicationAdvertPriceDto>

  getChargeCategory(nationalId: string): Promise<string>
}

export const IPriceCalculatorService = Symbol('IPriceCalculatorService')

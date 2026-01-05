import { DMRUser } from '@dmr.is/auth/dmrUser'

import { GetPaymentDataResponseDto } from '../../tbr/tbr.dto'

export interface IPriceCalculatorService {
  getPaymentData(advertId: string): Promise<GetPaymentDataResponseDto>

  getEstimatedPriceForApplication(
    applicationId: string,
    user: DMRUser,
  ): Promise<number>
}

export const IPriceCalculatorService = Symbol('IPriceCalculatorService')

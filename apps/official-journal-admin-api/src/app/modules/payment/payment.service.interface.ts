import { GetPaymentResponse } from '@dmr.is/official-journal/modules/price'
import { ResultWrapper } from '@dmr.is/types'

import { UpdateCasePriceBody } from '../case/dto/update-price-body.dto'

export interface ICasePaymentService {
  getExternalPaymentStatusByCaseId(
    caseId: string,
  ): Promise<ResultWrapper<GetPaymentResponse>>

  postExternalPaymentByCaseId(caseId: string): Promise<ResultWrapper>

  updateCasePriceByCaseId(
    caseId: string,
    body: UpdateCasePriceBody,
  ): Promise<ResultWrapper>
}

export const ICasePaymentService = Symbol('ICasePaymentService')

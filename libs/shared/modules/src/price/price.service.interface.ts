import { Transaction } from 'sequelize'
import {
  ApplicationFeeCodesResponse,
  CasePriceResponse,
  GetPaymentQuery,
  GetPaymentResponse,
  UpdateCasePaymentBody,
  UpdateCasePriceBody,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import 'multer'

export interface IPriceService {
  getFeeByApplication(
    applicationId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CasePriceResponse>>
  updateCasePriceByCaseId(
    caseId: string,
    body: UpdateCasePriceBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper>
  getAllFeeCodes(
    transaction?: Transaction,
  ): Promise<ResultWrapper<ApplicationFeeCodesResponse>>
  postExternalPayment(
    caseId: string,
    body: UpdateCasePaymentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper>
  getExternalPaymentStatus(
    params: GetPaymentQuery,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetPaymentResponse>>
  postExternalPaymentByCaseId(
    caseId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper>
}

export const IPriceService = Symbol('IPriceService')

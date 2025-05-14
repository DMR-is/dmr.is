import { Transaction } from 'sequelize'

import {
  CasePriceResponse,
  GetPaymentQuery,
  GetPaymentResponse,
  TransactionFeeCodesResponse,
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
  ): Promise<ResultWrapper<TransactionFeeCodesResponse>>
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

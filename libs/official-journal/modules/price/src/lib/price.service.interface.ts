import { Transaction } from 'sequelize'
import { ResultWrapper } from '@dmr.is/types'

import 'multer'
import {
  CasePriceResponse,
  GetPaymentQuery,
  GetPaymentResponse,
  UpdateCasePaymentBody,
  UpdateCasePriceBody,
} from '@dmr.is/official-journal/modules/case'
import { TransactionFeeCodesResponse } from '@dmr.is/official-journal/modules/application'

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

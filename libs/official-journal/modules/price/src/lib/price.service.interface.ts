import { Transaction } from 'sequelize'
import { ResultWrapper } from '@dmr.is/types'

import { CaseFeeCalculationBody } from './dto/fee-calculator-body.dto'
import {
  GetPaymentQuery,
  GetPaymentResponse,
} from './dto/get-case-payment-response.dto'
import { PostExternalPaymentBody } from './dto/payment.dto'
import { PriceByDepartmentResponse } from './dto/tbr-transaction.dto'
import { TransactionFeeCodesResponse } from './dto/transaction-free-code.dto'

export interface IPriceService {
  getAllFeeCodes(
    transaction?: Transaction,
  ): Promise<ResultWrapper<TransactionFeeCodesResponse>>
  postExternalPayment(body: PostExternalPaymentBody): Promise<ResultWrapper>
  getExternalPaymentStatus(
    params: GetPaymentQuery,
  ): Promise<ResultWrapper<GetPaymentResponse>>
  getPriceByDepartmentSlug(
    body: CaseFeeCalculationBody,
  ): Promise<ResultWrapper<PriceByDepartmentResponse>>
}

export const IPriceService = Symbol('IPriceService')

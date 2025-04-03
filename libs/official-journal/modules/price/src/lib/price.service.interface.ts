import { Transaction } from 'sequelize'
import { ResultWrapper } from '@dmr.is/types'
import { TransactionFeeCodesResponse } from './dto/transaction-free-code.dto'
import { PostExternalPaymentBody } from './dto/payment.dto'
import {
  GetPaymentQuery,
  GetPaymentResponse,
} from './dto/get-case-payment-response.dto'
import { CaseFeeCalculationBody } from './dto/fee-calculator-body.dto'
import { PriceByDepartmentResponse } from './dto/tbr-transaction.dto'

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

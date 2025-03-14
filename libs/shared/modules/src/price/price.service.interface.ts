import { Transaction } from 'sequelize'
import {
  ApplicationFeeCodesResponse,
  CasePriceResponse,
  GetAllFeeCodesParams,
  UpdateCasePriceBody,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import 'multer'

export interface IPriceService {
  getFeeByApplication(
    applicationId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CasePriceResponse>>
  getFeeByCase(
    caseId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CasePriceResponse>>
  updateCasePriceByCaseId(
    caseId: string,
    body: UpdateCasePriceBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper>
  getAllFeeCodes(
    params?: GetAllFeeCodesParams,
    transaction?: Transaction,
  ): Promise<ResultWrapper<ApplicationFeeCodesResponse>>
}

export const IPriceService = Symbol('IPriceService')

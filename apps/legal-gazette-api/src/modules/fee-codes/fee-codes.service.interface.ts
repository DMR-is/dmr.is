import { GetFeeCodesResponse } from './dto/fee-codes.dto'

export interface IFeeCodesService {
  getFeeCodes(): Promise<GetFeeCodesResponse>
}

export const IFeeCodesService = Symbol('IFeeCodesService')

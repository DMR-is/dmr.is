import { FeeCodeDto, GetFeeCodesResponse } from './dto/fee-codes.dto'

export interface IFeeCodesService {
  getFeeCodes(): Promise<GetFeeCodesResponse>
  getFeeCodeById(id: string): Promise<FeeCodeDto>
}

export const IFeeCodesService = Symbol('IFeeCodesService')

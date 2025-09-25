import { FeeCodeDto, GetFeeCodesResponse } from './dto/fee-codes.dto'

export interface IFeeCodeService {
  getFeeCodes(): Promise<GetFeeCodesResponse>
  getFeeCodeById(id: string): Promise<FeeCodeDto>
}

export const IFeeCodeService = Symbol('IFeeCodeService')

import { FeeCodeDto, GetFeeCodesResponse } from '../../models/fee-code.model'

export interface IFeeCodeService {
  getFeeCodes(): Promise<GetFeeCodesResponse>
  getFeeCodeById(id: string): Promise<FeeCodeDto>
}

export const IFeeCodeService = Symbol('IFeeCodeService')

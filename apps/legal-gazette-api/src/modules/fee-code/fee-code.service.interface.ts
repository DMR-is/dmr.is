import { FeeCodeDto } from '../../models/fee-code.model'
import { GetFeeCodesResponse } from './dto/fee-code.dto'

export interface IFeeCodeService {
  getFeeCodes(): Promise<GetFeeCodesResponse>
  getFeeCodeById(id: string): Promise<FeeCodeDto>
}

export const IFeeCodeService = Symbol('IFeeCodeService')

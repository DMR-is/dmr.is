import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { FeeCodeDto, GetFeeCodesResponse } from './dto/fee-codes.dto'
import { FeeCodeModel } from '../../models/fee-code.model'
import { IFeeCodeService } from './fee-code.service.interface'

@Injectable()
export class FeeCodeService implements IFeeCodeService {
  constructor(
    @InjectModel(FeeCodeModel)
    private readonly feeCodesModel: typeof FeeCodeModel,
  ) {}
  async getFeeCodeById(id: string): Promise<FeeCodeDto> {
    const feeCode = await this.feeCodesModel.findByPkOrThrow(id)

    return feeCode.fromModel()
  }

  async getFeeCodes(): Promise<GetFeeCodesResponse> {
    const feeCodes = await this.feeCodesModel.findAll()

    return {
      feeCodes: feeCodes.map((feeCode) => feeCode.fromModel()),
    }
  }
}

import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { FeeCodeDto, GetFeeCodesResponse } from './dto/fee-codes.dto'
import { FeeCodesModel } from './fee-codes.model'
import { IFeeCodesService } from './fee-codes.service.interface'

@Injectable()
export class FeeCodesService implements IFeeCodesService {
  constructor(
    @InjectModel(FeeCodesModel)
    private readonly feeCodesModel: typeof FeeCodesModel,
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

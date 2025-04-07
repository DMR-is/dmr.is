import { Transaction } from 'sequelize'
import { AdvertCorrectionModel } from '@dmr.is/official-journal/models'
import { ResultWrapper } from '@dmr.is/types'

import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { AddCaseAdvertCorrection } from './dto/advert-correction.dto'
import { IAdvertCorrectionService } from './advert-correction.service.interface'

@Injectable()
export class AdvertCorrectionService implements IAdvertCorrectionService {
  constructor(
    @InjectModel(AdvertCorrectionModel)
    private readonly advertCorrectionModel: typeof AdvertCorrectionModel,
  ) {}
  async postCaseCorrection(
    advertId: string,
    body: AddCaseAdvertCorrection,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    await this.advertCorrectionModel.create(
      {
        ...body,
        advertId: advertId,
      },
      { transaction: transaction },
    )

    return ResultWrapper.ok()
  }
}

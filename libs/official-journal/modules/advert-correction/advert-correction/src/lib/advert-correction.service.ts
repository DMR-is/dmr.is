import { Injectable } from '@nestjs/common'
import { IAdvertCorrectionService } from './advert-correction.service.interface'
import { ResultWrapper } from '@dmr.is/types'
import { Transaction } from 'sequelize'
import { AddCaseAdvertCorrection } from './dto/advert-correction.dto'
import { InjectModel } from '@nestjs/sequelize'
import {
  AdvertCorrectionModel,
  CaseModel,
} from '@dmr.is/official-journal/models'

@Injectable()
export class AdvertCorrectionService implements IAdvertCorrectionService {
  constructor(
    @InjectModel(AdvertCorrectionModel)
    private readonly advertCorrectionModel: typeof AdvertCorrectionModel,
    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,
  ) {}
  async postCaseCorrection(
    caseId: string,
    body: AddCaseAdvertCorrection,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const caseLookup = await this.caseModel.findByPk(caseId, {
      attributes: ['advertId'],
    })

    if (!caseLookup) {
      return ResultWrapper.err({
        code: 404,
        message: 'Case not found',
      })
    }

    const { advertId } = caseLookup

    if (!advertId) {
      return ResultWrapper.err({
        code: 409,
        message: 'Advert id not found, case not published.',
      })
    }

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

import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { CaseModel } from '../case/case.model'
import { CreateCommonAdvertInternalDto } from './dto/create-common-advert.dto'
import { ICommonCaseService } from './common-advert.service.interface'

@Injectable()
export class CommonCaseService implements ICommonCaseService {
  constructor(
    @InjectModel(CaseModel)
    private readonly caseModel: typeof CaseModel,
  ) {}
  async createCommonCase(body: CreateCommonAdvertInternalDto): Promise<void> {
    await this.caseModel.createCommonAdvert({
      applicationId: body.applicationId,
      caption: body.caption,
      categoryId: body.categoryId,
      publishingDates: body.publishingDates,
      signature: {
        name: body.signature.name,
        date: body.signature.date,
        location: body.signature.location,
      },
      channels: body.channels,
      html: body.html,
    })
  }
}

import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { CasePublicationDateModel } from '../case-publication-dates/case-publication-dates.model'
import { CommunicationChannelModel } from '../communication-channel/communication-channel.model'
import { ICaseService } from './case.service.interface'
import { CaseModel } from './cases.model'

@Injectable()
export class CaseService implements ICaseService {
  constructor(
    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,
  ) {}

  async create(body: any): Promise<any> {
    const randomCaseNumber = Math.floor(Math.random() * 1000000)

    const model = await this.caseModel.create(
      { ...body, caseNumber: randomCaseNumber },
      {
        include: [CommunicationChannelModel, CasePublicationDateModel],
      },
    )

    return model
  }
}

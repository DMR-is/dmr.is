import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { CommunicationChannelModel } from '../communication-channel/communication-channel.model'
import { ICaseService } from './case.service.interface'
import { CaseModel } from './cases.model'

@Injectable()
export class CaseService implements ICaseService {
  constructor(
    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,
  ) {}

  createCommonCase(body: any): void {
    throw new Error('Method not implemented.')
  }

  async create(body: any): Promise<any> {
    const randomCaseNumber = Math.floor(Math.random() * 1000000)

    const model = await this.caseModel.create(
      { ...body },
      {
        include: [CommunicationChannelModel],
      },
    )

    return model
  }
}

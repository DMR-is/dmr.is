import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { CommunicationChannelModel } from '../communication-channel/communication-channel.model'
import { CaseDto, GetCasesDto } from './dto/case.dto'
import { caseMigrate } from './dto/case.migrate'
import { ICaseService } from './case.service.interface'
import { CaseModel } from './cases.model'

@Injectable()
export class CaseService implements ICaseService {
  constructor(
    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,
  ) {}
  async getCases(): Promise<GetCasesDto> {
    const cases = await this.caseModel.findAll()

    const migrated = cases.map((model) => caseMigrate(model))

    return {
      cases: migrated,
    }
  }
  getCase(id: string): Promise<CaseDto> {
    throw new Error('Method not implemented.')
  }

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

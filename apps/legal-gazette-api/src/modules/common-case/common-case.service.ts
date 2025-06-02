import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { COMMON_APPLICATION_TYPE_ID } from '@dmr.is/legal-gazette/constants'

import { mapIndexToVersion } from '../../lib/utils'
import { CaseModel } from '../cases/cases.model'
import { CreateCommonCaseInternalDto } from './dto/common-case.dto'
import { ICommonCaseService } from './common-case.service.interface'

@Injectable()
export class CommonCaseService implements ICommonCaseService {
  constructor(
    @InjectModel(CaseModel)
    private readonly caseModel: typeof CaseModel,
  ) {}
  async createCommonCase(body: CreateCommonCaseInternalDto): Promise<void> {
    await this.caseModel.create({
      typeId: COMMON_APPLICATION_TYPE_ID,
      caseTitle: body.caption,
      categoryId: body.categoryId,
      communicationChannels:
        body.channels?.map((channel) => ({
          email: channel.email,
          phone: channel.phone,
          name: channel.name,
        })) ?? [],
      commonCase: {
        signatureDate: new Date(body.signature.date),
        signatureLocation: body.signature.location,
        signatureName: body.signature.name,
        caption: body.caption,
      },
      adverts: body.publishingDates.map((date, i) => ({
        scheduledAt: new Date(date),
        version: mapIndexToVersion(i),
        html: body.html,
      })),
    })
  }
}

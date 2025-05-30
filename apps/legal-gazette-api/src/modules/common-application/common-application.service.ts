import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { CaseModel } from '../cases/cases.model'
import { SubmitCommonApplicationDto } from './dto/common-application.dto'
import { ICommonApplicationService } from './common-application.service.interface'

@Injectable()
export class CommonApplicationService implements ICommonApplicationService {
  constructor(
    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,
  ) {}
  async submitApplication(body: SubmitCommonApplicationDto): Promise<void> {
    await this.caseModel.createCommonCase({
      caption: body.caption,
      applicationId: body.applicationId,
      categoryId: body.categoryId,
      channels: body.channels,
      publishingDates: body.publishingDates,
      html: body.html,
      signature: {
        date: body.signature.date,
        location: body.signature.location,
        name: body.signature.name,
      },
    })
  }
}

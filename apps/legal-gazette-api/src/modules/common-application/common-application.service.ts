import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { AuthService } from '@dmr.is/modules'

import { CaseStatusIdEnum } from '../case-status/case-status.model'
import { CaseModel } from '../cases/cases.model'
import { SubmitCommonApplicationDto } from './dto/common-application.dto'
import { ICommonApplicationService } from './common-application.service.interface'

@Injectable()
export class CommonApplicationService implements ICommonApplicationService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(AuthService) private readonly authService: AuthService,
    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,
  ) {}

  async deleteApplication(applicationId: string): Promise<void> {
    const caseInstance = await this.caseModel
      .scope(['byApplicationId', applicationId])
      .findOne()

    if (!caseInstance) {
      this.logger.warn('No case found for application', {
        applicationId,
        context: 'CommonApplicationService',
      })

      return
    }

    await this.caseModel.setCaseStatus(
      caseInstance.id,
      CaseStatusIdEnum.WITHDRAWN,
    )
  }

  async updateApplicationState(
    applicationId: string,
    event: 'APPROVE' | 'REJECT',
  ): Promise<void> {
    await this.authService.xroadFetch(
      `${process.env.XROAD_ISLAND_IS_PATH}/application-callback-v2/applications/${applicationId}/submit`,
      {
        method: 'PUT',
        body: new URLSearchParams({
          event: event,
        }),
      },
    )
  }

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

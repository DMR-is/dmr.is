import { Inject, Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { InjectModel } from '@nestjs/sequelize'

import { LegalGazetteEvents } from '@dmr.is/legal-gazette/constants'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { AuthService, IAuthService } from '@dmr.is/modules'

import { CaseStatusIdEnum } from '../case-status/case-status.model'
import { CaseModel } from '../cases/cases.model'
import {
  CommonApplicationUpdateStateEvent,
  SubmitCommonApplicationDto,
} from './dto/common-application.dto'
import { ICommonApplicationService } from './common-application.service.interface'

@Injectable()
export class CommonApplicationService implements ICommonApplicationService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IAuthService) private readonly authService: AuthService,
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

  @OnEvent(LegalGazetteEvents.COMMON_APPLICATION_UPDATE)
  async updateApplicationState(
    body: CommonApplicationUpdateStateEvent,
  ): Promise<void> {
    await this.authService.xroadFetch(
      `${process.env.XROAD_ISLAND_IS_PATH}/application-callback-v2/applications/${body.applicationId}/submit`,
      {
        method: 'PUT',
        body: new URLSearchParams({
          event: body.event,
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

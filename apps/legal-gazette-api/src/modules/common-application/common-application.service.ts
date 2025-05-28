import { Inject, Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { InjectModel } from '@nestjs/sequelize'

import {
  COMMON_APPLICATION_TYPE_ID,
  LegalGazetteEvents,
} from '@dmr.is/legal-gazette/constants'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { AdvertModel } from '../advert/advert.model'
import { CaseModel } from '../cases/cases.model'
import { CommonCaseModel } from '../common-case/common-case.model'
import { CommunicationChannelModel } from '../communication-channel/communication-channel.model'
import { SubmitCommonApplicationDto } from './dto/common-application.dto'
import { ICommonApplicationService } from './common-application.service.interface'

@Injectable()
export class CommonApplicationService implements ICommonApplicationService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,
    private eventEmitter: EventEmitter2,
  ) {}
  async submitApplication(body: SubmitCommonApplicationDto): Promise<void> {
    await this.caseModel.create(
      {
        applicationId: body.applicationId,
        categoryId: body.categoryId,
        typeId: COMMON_APPLICATION_TYPE_ID,
        communicationChannels: body.channels.map((ch) => ({
          email: ch.email,
          name: ch.name,
          phone: ch.phone,
        })),
        commonCase: {
          caption: body.caption,
          signatureDate: new Date(body.signature.date),
          signatureLocation: body.signature.location,
          signatureName: body.signature.name,
        },
        adverts: body.publishingDates.map((date) => ({
          html: body.html,
          scheduledAt: new Date(date),
        })),
      },
      {
        include: [CommunicationChannelModel, CommonCaseModel, AdvertModel],
      },
    )

    this.eventEmitter.emit(LegalGazetteEvents.COMMON_APPLICATION_SUBMITTED, {})
  }
}

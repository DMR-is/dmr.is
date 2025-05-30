import addDays from 'date-fns/addDays'

import { Inject, Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { InjectModel } from '@nestjs/sequelize'

import {
  COMMON_APPLICATION_TYPE_ID,
  LegalGazetteEvents,
} from '@dmr.is/legal-gazette/constants'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { IAuthService } from '@dmr.is/modules'

import { mapIndexToVersion } from '../../lib/utils'
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
    @Inject(IAuthService) private readonly authService: IAuthService,
    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,
    private eventEmitter: EventEmitter2,
  ) {}
  async submitApplication(body: SubmitCommonApplicationDto): Promise<void> {
    await this.caseModel.create(
      {
        applicationId: body.applicationId,
        categoryId: body.categoryId,
        typeId: COMMON_APPLICATION_TYPE_ID,
        caseTitle: body.caption,
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
        adverts:
          body.publishingDates.length > 0
            ? body.publishingDates.map((date, i) => ({
                html: body.html,
                scheduledAt: new Date(date),
                version: mapIndexToVersion(i),
              }))
            : [
                {
                  html: body.html,
                  scheduledAt: addDays(new Date(), 14),
                },
              ],
      },
      {
        include: [CommunicationChannelModel, CommonCaseModel, AdvertModel],
      },
    )

    this.eventEmitter.emit(LegalGazetteEvents.COMMON_APPLICATION_SUBMITTED, {})
  }
}

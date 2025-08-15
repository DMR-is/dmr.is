import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { AdvertModel, AuthService, IAuthService } from '@dmr.is/modules'

import { mapIndexToVersion } from '../../../../lib/utils'
import { CommonAdvertModel } from '../../../advert/common/common-advert.model'
import { CaseModel } from '../../../case/case.model'
import { CommunicationChannelModel } from '../../../communication-channel/communication-channel.model'
import { StatusIdEnum } from '../../../status/status.model'
import { TypeIdEnum } from '../../../type/type.model'
import {
  IslandIsCommonApplicationEventsEnum,
  IslandIsCommonApplicationUpdateStateEventDto,
  IslandIsSubmitCommonApplicationDto,
} from './dto/island-is-application.dto'
import { IIslandIsCommonApplicationService } from './island-is-application.service.interface'

@Injectable()
export class IslandIsCommonApplicationService
  implements IIslandIsCommonApplicationService
{
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IAuthService) private readonly authService: AuthService,
    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,
  ) {}

  async deleteApplication(applicationId: string, user: DMRUser): Promise<void> {
    const caseInstance = await this.caseModel
      .scope(['byApplicationId', applicationId])
      .findOne()

    if (!caseInstance) {
      this.logger.warn('No case found for application', {
        applicationId,
        context: 'CommonApplicationService',
      })

      throw new NotFoundException(`No case found for application`)
    }

    await this.caseModel.destroy({
      where: { id: caseInstance.id },
      individualHooks: true,
    })
  }

  async updateApplicationState(
    body: IslandIsCommonApplicationUpdateStateEventDto,
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

  async submitApplication(
    body: IslandIsSubmitCommonApplicationDto,
    user: DMRUser,
  ): Promise<void> {
    const submittedBy = `${user.name}${user.actor ? ` ( ${user.actor.name})` : ''}`

    await this.caseModel.create(
      {
        communicationChannels: body.channels?.map((ch) => ({
          email: ch.email,
          name: ch.name,
          phone: ch.phone,
        })),
        involvedPartyNationalId: user.nationalId,
        adverts: body.publishingDates.map((date, i) => ({
          categoryId: body.categoryId,
          statusId: StatusIdEnum.SUBMITTED,
          typeId: TypeIdEnum.COMMON_ADVERT,
          scheduledAt: new Date(date),
          title: body.caption,
          html: body.html,
          version: mapIndexToVersion(i),
          submittedBy: submittedBy,
          commonAdvert: {
            islandIsApplicationId: body.applicationId,
            caption: body.caption,
            signatureDate: new Date(body.signature.date),
            signatureLocation: body.signature.location,
            signatureName: body.signature.name,
          },
        })),
      },
      {
        include: [
          { model: CommunicationChannelModel },
          { model: AdvertModel, include: [{ model: CommonAdvertModel }] },
        ],
      },
    )

    await this.updateApplicationState({
      applicationId: body.applicationId,
      event: IslandIsCommonApplicationEventsEnum.APPROVE,
    })
  }
}

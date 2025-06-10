import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { InjectModel } from '@nestjs/sequelize'

import { LegalGazetteEvents } from '@dmr.is/legal-gazette/constants'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { AuthService, IAuthService } from '@dmr.is/modules'

import { CaseModel } from '../case/case.model'
import { InstitutionModel } from '../institution/institution.model'
import { UserInstitutionModel } from '../users/user-institutions.model'
import { UserModel } from '../users/users.model'
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
    @InjectModel(UserModel) private readonly userModel: typeof UserModel,
    @InjectModel(InstitutionModel)
    private readonly institutionModel: typeof InstitutionModel,
    @InjectModel(UserInstitutionModel)
    private readonly userInstitutionModel: typeof UserInstitutionModel,
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

      throw new NotFoundException(`No case found for application`)
    }

    await this.caseModel.destroy({
      where: { id: caseInstance.id },
      individualHooks: true,
    })
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
    const actorNationalId = '0000000000'
    const institutionNationalId = '0101010101'

    const [institution] = body.institution
      ? await this.institutionModel.upsert(
          {
            nationalId: institutionNationalId,
            title: body.institution.title,
          },
          {
            conflictWhere: { nationalId: institutionNationalId },
            returning: ['id'],
            hooks: true,
          },
        )
      : [null]

    const [user] = await this.userModel.upsert(
      {
        email: body.actor.email,
        firstName: body.actor.firstName,
        lastName: body.actor.lastName,
        nationalId: actorNationalId,
        phone: body.actor.phone,
        lastSubmissionDate: new Date(),
      },
      {
        conflictWhere: { nationalId: actorNationalId },
        returning: ['id'],
      },
    )

    if (institution?.id && user?.id) {
      await this.userInstitutionModel.upsert(
        {
          userId: user.id,
          institutionId: institution.id,
        },
        {
          conflictWhere: {
            userId: user.id,
            institutionId: institution.id,
          },
          returning: false,
        },
      )
    }

    await this.caseModel.createCommonAdvert({
      applicationId: body.applicationId,
      caption: body.caption,
      categoryId: body.categoryId,
      publishingDates: body.publishingDates,
      signature: body.signature,
      channels: body.channels,
      html: body.html,
    })
  }
}

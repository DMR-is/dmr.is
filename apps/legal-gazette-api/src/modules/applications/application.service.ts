import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { PagingQuery } from '@dmr.is/shared/dto'
import { generatePaging, getLimitAndOffset } from '@dmr.is/utils'

import {
  createCommonAdvertFromApplicationSchema,
  createCommonAdvertFromIslandIsApplicationSchema,
} from '../../lib/schemas'
import { getCommonAdvertHTMLTemplate } from '../../lib/templates'
import { mapIndexToVersion } from '../../lib/utils'
import { AdvertModel } from '../advert/advert.model'
import { CaseModel } from '../case/case.model'
import { CaseDto } from '../case/dto/case.dto'
import { TypeIdEnum } from '../type/type.model'
import { IslandIsSubmitCommonApplicationDto } from './common/island-is/dto/island-is-application.dto'
import { ApplicationsDto } from './dto/application.dto'
import { ApplicationModel, ApplicationTypeEnum } from './application.model'
import { IApplicationService } from './application.service.interface'

@Injectable()
export class ApplicationService implements IApplicationService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,
    @InjectModel(AdvertModel) private readonly advertModel: typeof AdvertModel,
    @InjectModel(ApplicationModel)
    private readonly applicationModel: typeof ApplicationModel,
  ) {}

  private async submitCommonApplication(applicationId: string, user: DMRUser) {
    const application = await this.applicationModel.scope('common').findOne({
      where: { id: applicationId, submittedByNationalId: user.nationalId },
      include: [{ model: CaseModel, attributes: ['id', 'caseNumber'] }],
    })

    if (!application) {
      throw new NotFoundException()
    }

    const parsedApplication = createCommonAdvertFromApplicationSchema.safeParse(
      application.dataValues,
    )

    if (!parsedApplication.success) {
      throw new BadRequestException('Invalid application data')
    }

    const createdBy =
      `${user.name} ${user.actor ? `(${user.actor})` : ''}`.trim()

    await this.advertModel.bulkCreate(
      parsedApplication.data.publishingDates.map((scheduledAt, i) => ({
        typeId: TypeIdEnum.COMMON_ADVERT,
        caption: parsedApplication.data.caption,
        version: mapIndexToVersion(i),
        caseId: parsedApplication.data.caseId,
        categoryId: parsedApplication.data.category.id,
        additionalText: parsedApplication.data.additionalText,
        createdBy: createdBy,
        scheduledAt: scheduledAt,
        html: getCommonAdvertHTMLTemplate({
          caption: parsedApplication.data.caption,
          category: parsedApplication.data.category.title,
          html: parsedApplication.data.html,
          caseNumber: application.case.caseNumber,
          publishedAt: scheduledAt,
          signatureDate: parsedApplication.data.signatureDate,
          signatureLocation: parsedApplication.data.signatureLocation,
          signatureName: parsedApplication.data.signatureName,
          additionalText: parsedApplication.data.additionalText,
          version: mapIndexToVersion(i),
        }),
        signatureName: parsedApplication.data.signatureName,
        signatureOnBehalfOf: parsedApplication.data.signatureOnBehalfOf,
        signatureLocation: parsedApplication.data.signatureLocation,
        signatureDate: parsedApplication.data.signatureDate,
      })),
    )
  }

  async createApplication(
    applicationType: ApplicationTypeEnum,
    user: DMRUser,
  ): Promise<CaseDto> {
    const caseData = await this.caseModel.create(
      {
        involvedPartyNationalId: user.nationalId,
        application: {
          applicationType: applicationType,
          submittedByNationalId: user.nationalId,
        },
      },
      {
        include: [{ model: ApplicationModel }],
      },
    )

    return caseData.fromModel()
  }

  async getMyApplications(
    query: PagingQuery,
    user: DMRUser,
  ): Promise<ApplicationsDto> {
    const { limit, offset } = getLimitAndOffset(query)
    const applications = await this.applicationModel.findAndCountAll({
      limit,
      offset,
      where: {
        submittedByNationalId: user.nationalId,
      },
    })

    const mapped = applications.rows.map((app) => app.fromModel())

    const paging = generatePaging(
      applications.rows,
      query.page,
      query.pageSize,
      applications.count,
    )

    return { applications: mapped, ...paging }
  }

  async submitIslandIsApplication(
    body: IslandIsSubmitCommonApplicationDto,
    user: DMRUser,
  ): Promise<void> {
    const parsedApplication =
      createCommonAdvertFromIslandIsApplicationSchema.safeParse({
        islandIsApplicationId: body.applicationId,
        categoryId: body.categoryId,
        caption: body.caption,
        additionalText: body.additionalText,
        html: body.html,
        signatureName: body.signature.name,
        signatureOnBehalfOf: body.signature.onBehalfOf,
        signatureLocation: body.signature.location,
        signatureDate: new Date(body.signature.date),
        communicationChannels: body.communicationChannels,
        publishingDates: body.publishingDates.map((date) => new Date(date)),
      })

    if (!parsedApplication.success) {
      throw new BadRequestException('Invalid application data')
    }

    const createdCase = await this.caseModel.create(
      {
        involvedPartyNationalId: user.nationalId,
        application: {
          applicationType: ApplicationTypeEnum.COMMON,
          submittedByNationalId: user.nationalId,
          ...parsedApplication.data,
        },
      },
      {
        include: [{ model: ApplicationModel }],
        returning: true,
      },
    )

    if (!createdCase.application) {
      this.logger.error(
        'Case created without application for IslandIs submission',
        {
          caseId: createdCase.id,
          userNationalId: user.nationalId,
        },
      )
      throw new InternalServerErrorException()
    }

    return this.submitCommonApplication(createdCase.application.id, user)
  }
  async submitApplication(applicationId: string, user: DMRUser): Promise<void> {
    const application = await this.applicationModel.findOne({
      where: { id: applicationId, submittedByNationalId: user.nationalId },
    })

    if (!application) {
      throw new NotFoundException()
    }

    switch (application.applicationType) {
      case ApplicationTypeEnum.COMMON:
        return this.submitCommonApplication(applicationId, user)
      default:
        this.logger.warn(
          `Attempted to submit application with unknown type: ${application.applicationType}`,
        )
        throw new BadRequestException()
    }
  }
}

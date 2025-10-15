import addDays from 'date-fns/addDays'
import { Op } from 'sequelize'

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { PagingQuery } from '@dmr.is/shared/dto'
import {
  generatePaging,
  getLimitAndOffset,
  getNextWeekDay,
} from '@dmr.is/utils'

import {
  RECALL_BANKRUPTCY_ADVERT_TYPE_ID,
  RECALL_CATEGORY_ID,
  RECALL_DECEASED_ADVERT_TYPE_ID,
} from '../../lib/constants'
import {
  createCommonAdvertFromApplicationSchema,
  createCommonAdvertFromIslandIsApplicationSchema,
  createRecallAdvertFromApplicationSchema,
} from '../../lib/schemas'
import { AdvertModel } from '../advert/advert.model'
import { IAdvertService } from '../advert/advert.service.interface'
import { CaseModel } from '../case/case.model'
import { CaseDto } from '../case/dto/case.dto'
import {
  CategoryDefaultIdEnum,
  CategoryModel,
} from '../category/category.model'
import {
  CommunicationChannelCreateAttributes,
  CommunicationChannelModel,
} from '../communication-channel/communication-channel.model'
import { SettlementModel } from '../settlement/settlement.model'
import { TypeIdEnum } from '../type/type.model'
import {
  AddDivisionEndingForApplicationDto,
  AddDivisionMeetingForApplicationDto,
  ApplicationDetailedDto,
  ApplicationsDto,
  UpdateApplicationDto,
} from './dto/application.dto'
import { IslandIsSubmitCommonApplicationDto } from './dto/island-is-application.dto'
import { ApplicationModel, ApplicationTypeEnum } from './application.model'
import { IApplicationService } from './application.service.interface'
import { ApplicationStatusEnum } from './contants'

@Injectable()
export class ApplicationService implements IApplicationService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IAdvertService) private readonly advertService: IAdvertService,
    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,
    @InjectModel(AdvertModel) private readonly advertModel: typeof AdvertModel,
    @InjectModel(ApplicationModel)
    private readonly applicationModel: typeof ApplicationModel,
    @InjectModel(CategoryModel)
    private readonly categoryModel: typeof CategoryModel,
    @InjectModel(SettlementModel)
    private readonly settlementModel: typeof SettlementModel,
  ) {}

  private async submitCommonApplication(
    application: ApplicationModel,
    user: DMRUser,
  ) {
    const requiredFields = createCommonAdvertFromApplicationSchema.parse({
      caseId: application.caseId,
      type: application.type,
      category: application.category,
      caption: application.caption,
      additionalText: application.additionalText,
      html: application.html,
      signatureName: application.signatureName,
      signatureOnBehalfOf: application.signatureOnBehalfOf,
      signatureLocation: application.signatureLocation,
      signatureDate: application.signatureDate,
      communicationChannels: application.communicationChannels,
      publishingDates: application.publishingDates,
    })

    await this.advertService.createAdvert({
      caseId: requiredFields.caseId,
      typeId: requiredFields.type.id,
      caption: requiredFields.caption,
      categoryId: requiredFields.category.id,
      additionalText: requiredFields.additionalText,
      createdBy: user.fullName,
      createdByNationalId: user.nationalId,
      signatureName: requiredFields.signatureName,
      signatureOnBehalfOf: requiredFields.signatureOnBehalfOf,
      signatureLocation: requiredFields.signatureLocation,
      signatureDate: requiredFields.signatureDate.toISOString(),
      content: requiredFields.html,
      title: `${requiredFields.category.title} - ${requiredFields.caption}`,
      communicationChannels: requiredFields.communicationChannels,
      scheduledAt: requiredFields.publishingDates.map((d) => d.toISOString()),
    })

    await application.update({ status: ApplicationStatusEnum.FINISHED })
  }

  private async submitRecallApplication(
    application: ApplicationModel,
    user: DMRUser,
  ) {
    const requiredFields = createRecallAdvertFromApplicationSchema.parse({
      settlementName: application.settlementName,
      settlementNationalId: application.settlementNationalId,
      settlementAddress: application.settlementAddress,
      settlementDateOfDeath: application.settlementDateOfDeath,
      settlementDeadlineDate: application.settlementDeadlineDate,
      liquidatorName: application.liquidatorName,
      liquidatorLocation: application.liquidatorLocation,
      signatureName: application.liquidatorName,
      signatureOnBehalfOf: application.liquidatorOnBehalfOf,
      signatureDate: application.signatureDate,
      signatureLocation: application.signatureLocation,
      divisionMeetingDate: application.divisionMeetingDate,
      divisionMeetingLocation: application.divisionMeetingLocation,
      judgementDate: application.judgmentDate,
      courtDistrictId: application.courtDistrictId,
      communicationChannels: application.communicationChannels,
    })

    const applicationType = application.applicationType

    const isBankruptcy =
      applicationType === ApplicationTypeEnum.RECALL_BANKRUPTCY

    if (isBankruptcy && !requiredFields.settlementDeadlineDate) {
      throw new BadRequestException(
        'Settlement deadline date is required for bankruptcy recall applications',
      )
    }

    if (!isBankruptcy && !requiredFields.settlementDateOfDeath) {
      throw new BadRequestException(
        'Settlement date of death is required for bankruptcy recall applications',
      )
    }

    const title = isBankruptcy
      ? `Innköllun þrotabús - ${requiredFields.settlementName}`
      : `Innköllun dánarbús - ${requiredFields.settlementName}`

    await this.advertService.createAdvert({
      caseId: application.caseId,
      typeId: isBankruptcy
        ? RECALL_BANKRUPTCY_ADVERT_TYPE_ID
        : RECALL_DECEASED_ADVERT_TYPE_ID,
      categoryId: RECALL_CATEGORY_ID,
      createdBy: user.fullName,
      createdByNationalId: user.nationalId,
      signatureName: requiredFields.signatureName,
      signatureOnBehalfOf: requiredFields.signatureOnBehalfOf,
      signatureLocation: requiredFields.signatureLocation,
      signatureDate: requiredFields.signatureDate.toISOString(),
      title: title,
      divisionMeetingDate: requiredFields.divisionMeetingDate,
      divisionMeetingLocation: requiredFields.divisionMeetingLocation,
      judgementDate: requiredFields.judgementDate.toISOString(),
      courtDistrictId: requiredFields.courtDistrictId,
      settlement: {
        liquidatorName: requiredFields.signatureName,
        liquidatorLocation: requiredFields.liquidatorLocation,
        settlementAddress: requiredFields.settlementAddress,
        settlementName: requiredFields.settlementName,
        settlementNationalId: requiredFields.settlementNationalId,
        settlementDateOfDeath:
          requiredFields.settlementDateOfDeath?.toISOString(),
        settlementDeadline:
          requiredFields.settlementDeadlineDate?.toISOString(),
      },
      communicationChannels: requiredFields.communicationChannels,
      scheduledAt: application.publishingDates.map((d) => d.toISOString()),
    })

    await application.update({ status: ApplicationStatusEnum.SUBMITTED })
  }

  async addDivisionMeetingAdvertToApplication(
    applicationId: string,
    body: AddDivisionMeetingForApplicationDto,
    user: DMRUser,
  ): Promise<void> {
    const application = await this.applicationModel.findOneOrThrow({
      where: {
        id: applicationId,
        submittedByNationalId: user.nationalId,
        applicationType: {
          [Op.or]: [
            ApplicationTypeEnum.RECALL_BANKRUPTCY,
            ApplicationTypeEnum.RECALL_DECEASED,
          ],
        },
      },
    })

    const settlement = await this.advertModel.unscoped().findOneOrThrow({
      attributes: ['id', 'settlementId'],
      where: {
        caseId: application.caseId,
        settlementId: { [Op.not]: null },
      },
    })

    let communicationChannels: CommunicationChannelCreateAttributes[] = []

    if (body.communicationChannels && body.communicationChannels.length > 0) {
      communicationChannels = body.communicationChannels
    } else {
      const recallAdvert = await this.advertModel.unscoped().findOneOrThrow({
        attributes: ['id'],
        include: [{ model: CommunicationChannelModel }],
        where: {
          caseId: application.caseId,
          categoryId: RECALL_CATEGORY_ID,
        },
      })

      if (
        recallAdvert.communicationChannels &&
        recallAdvert.communicationChannels.length
      ) {
        communicationChannels = recallAdvert.communicationChannels.map(
          (ch) => ({
            email: ch.email,
            name: ch.name,
            phone: ch.phone,
          }),
        )
      }
    }

    await this.advertService.createAdvert({
      caseId: application.caseId,
      categoryId: CategoryDefaultIdEnum.DIVISION_MEETINGS,
      createdBy: user.fullName,
      createdByNationalId: user.nationalId,
      signatureName: body.signatureName,
      signatureDate: body.signatureDate,
      signatureLocation: body.signatureLocation,
      signatureOnBehalfOf: body.signatureOnBehalfOf,
      divisionMeetingDate: new Date(body.meetingDate),
      divisionMeetingLocation: body.meetingLocation,
      typeId: TypeIdEnum.DIVISION_MEETING,
      title: `Skiptafundur - ${application.settlementName}`,
      additionalText: body.additionalText,
      settlementId: settlement.settlementId,
      communicationChannels: communicationChannels.map((ch) => ({
        email: ch.email,
        name: ch.name ?? undefined,
        phone: ch.phone ?? undefined,
      })),
      scheduledAt: [body.meetingDate],
    })
  }

  async addDivisionEndingAdvertToApplication(
    applicationId: string,
    body: AddDivisionEndingForApplicationDto,
    user: DMRUser,
  ): Promise<void> {
    const application = await this.applicationModel.findOneOrThrow({
      where: {
        id: applicationId,
        submittedByNationalId: user.nationalId,
        status: ApplicationStatusEnum.SUBMITTED,
        applicationType: {
          [Op.or]: [
            ApplicationTypeEnum.RECALL_BANKRUPTCY,
            ApplicationTypeEnum.RECALL_DECEASED,
          ],
        },
      },
    })

    const advertSettlement = await this.advertModel.unscoped().findOneOrThrow({
      attributes: ['id', 'settlementId'],
      where: {
        caseId: application.caseId,
        settlementId: { [Op.not]: null },
      },
    })

    if (!advertSettlement.settlementId) {
      throw new NotFoundException('Settlement not found for application')
    }

    const settlement = await this.settlementModel.findByPkOrThrow(
      advertSettlement.settlementId,
    )

    await settlement.update({ settlementDeclaredClaims: body.declaredClaims })

    let communicationChannels: CommunicationChannelCreateAttributes[] = []

    if (body.communicationChannels && body.communicationChannels.length > 0) {
      communicationChannels = body.communicationChannels
    } else {
      const recallAdvert = await this.advertModel.unscoped().findOneOrThrow({
        attributes: ['id'],
        include: [{ model: CommunicationChannelModel }],
        where: {
          caseId: application.caseId,
          categoryId: RECALL_CATEGORY_ID,
        },
      })

      if (
        recallAdvert.communicationChannels &&
        recallAdvert.communicationChannels.length
      ) {
        communicationChannels = recallAdvert.communicationChannels.map(
          (ch) => ({
            email: ch.email,
            name: ch.name,
            phone: ch.phone,
          }),
        )
      }
    }

    await this.advertService.createAdvert({
      caseId: application.caseId,
      categoryId: CategoryDefaultIdEnum.DIVISION_ENDINGS,
      createdBy: user.fullName,
      createdByNationalId: user.nationalId,
      signatureName: body.signatureName,
      signatureDate: body.signatureDate,
      signatureLocation: body.signatureLocation,
      signatureOnBehalfOf: body.signatureOnBehalfOf,
      typeId: TypeIdEnum.DIVISION_ENDING,
      title: `Skiptalok - ${application.settlementName}`,
      additionalText: body.additionalText,
      settlementId: settlement.id,
      communicationChannels: communicationChannels.map((ch) => ({
        email: ch.email,
        name: ch.name ?? undefined,
        phone: ch.phone ?? undefined,
      })),
      scheduledAt: [body.scheduledAt],
    }),
      await application.update({ status: ApplicationStatusEnum.FINISHED })
  }

  async updateApplication(
    applicationId: string,
    body: UpdateApplicationDto,
    user: DMRUser,
  ): Promise<ApplicationDetailedDto> {
    const application = await this.applicationModel.findOne({
      where: { id: applicationId, submittedByNationalId: user.nationalId },
    })

    if (!application) {
      throw new NotFoundException()
    }

    await application.update({
      typeId: body.typeId,
      additionalText: body.additionalText,
      caption: body.caption,
      html: body.html,
      signatureDate:
        typeof body.signatureDate === 'string'
          ? new Date(body.signatureDate)
          : body.signatureDate,
      signatureLocation: body.signatureLocation,
      signatureName: body.signatureName,
      signatureOnBehalfOf: body.signatureOnBehalfOf,
      courtDistrictId: body.courtDistrictId,
      categoryId: body.categoryId,
      judgmentDate:
        typeof body.judgmentDate === 'string'
          ? new Date(body.judgmentDate)
          : body.judgmentDate,
      publishingDates: body.publishingDates?.map((d) => new Date(d)),
      communicationChannels: body.communicationChannels,
      liquidatorLocation: body.liquidatorLocation,
      liquidatorName: body.liquidatorName,
      liquidatorOnBehalfOf: body.liquidatorOnBehalfOf,
      divisionMeetingDate:
        typeof body.divisionMeetingDate === 'string'
          ? new Date(body.divisionMeetingDate)
          : body.divisionMeetingDate,
      divisionMeetingLocation: body.divisionMeetingLocation,
      settlementName: body.settlementName,
      settlementNationalId: body.settlementNationalId,
      settlementAddress: body.settlementAddress,
      settlementDateOfDeath:
        typeof body.settlementDateOfDeath === 'string'
          ? new Date(body.settlementDateOfDeath)
          : body.settlementDateOfDeath,
      settlementDeadlineDate:
        typeof body.settlementDeadlineDate === 'string'
          ? new Date(body.settlementDeadlineDate)
          : body.settlementDeadlineDate,
    })
    return application.fromModelToDetailedDto()
  }
  async getApplicationByCaseId(
    caseId: string,
    user: DMRUser,
  ): Promise<ApplicationDetailedDto> {
    const application = await this.applicationModel.findOne({
      where: { caseId: caseId, submittedByNationalId: user.nationalId },
    })

    if (!application) {
      throw new NotFoundException()
    }

    return application.fromModelToDetailedDto()
  }
  async getApplicationById(
    applicationId: string,
    user: DMRUser,
  ): Promise<ApplicationDetailedDto> {
    const application = await this.applicationModel.findOne({
      where: { id: applicationId, submittedByNationalId: user.nationalId },
    })

    if (!application) {
      throw new NotFoundException()
    }

    return application.fromModelToDetailedDto()
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
          publishingDates: [addDays(getNextWeekDay(new Date()), 14)],
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
    const newCase = await this.caseModel.create(
      { involvedPartyNationalId: user.nationalId },
      { returning: ['id'] },
    )

    const requiredFields =
      createCommonAdvertFromIslandIsApplicationSchema.parse({
        islandIsApplicationId: body.islandIsApplicationId,
        typeId: body.typeId,
        categoryId: body.categoryId,
        caption: body.caption,
        additionalText: body.additionalText,
        html: body.html,
        signatureName: body.signatureName,
        signatureOnBehalfOf: body.signatureOnBehalfOf,
        signatureLocation: body.signatureLocation,
        signatureDate: new Date(body.signatureDate),
        communicationChannels: body.communicationChannels,
        publishingDates: body.publishingDates.map((date) => new Date(date)),
      })

    const category = await this.categoryModel.findByPkOrThrow(
      requiredFields.categoryId,
    )

    await this.advertService.createAdvert({
      caseId: newCase.id,
      typeId: requiredFields.typeId,
      categoryId: requiredFields.categoryId,
      islandIsApplicationId: requiredFields.islandIsApplicationId,
      createdBy: user.fullName,
      createdByNationalId: user.nationalId,
      signatureDate: requiredFields.signatureDate.toISOString(),
      signatureLocation: requiredFields.signatureLocation,
      signatureName: requiredFields.signatureName,
      title: `${category.title} - ${requiredFields.caption}`,
      caption: requiredFields.caption,
      additionalText: requiredFields.additionalText,
      content: requiredFields.html,
      signatureOnBehalfOf: requiredFields.signatureOnBehalfOf,
      communicationChannels: requiredFields.communicationChannels,
      scheduledAt: requiredFields.publishingDates.map((d) => d.toISOString()),
    })
  }
  async submitApplication(applicationId: string, user: DMRUser): Promise<void> {
    const application = await this.applicationModel.findOneOrThrow({
      where: { id: applicationId, submittedByNationalId: user.nationalId },
    })

    switch (application.applicationType) {
      case ApplicationTypeEnum.COMMON:
        await this.submitCommonApplication(application, user)
        break
      case ApplicationTypeEnum.RECALL_BANKRUPTCY:
      case ApplicationTypeEnum.RECALL_DECEASED:
        await this.submitRecallApplication(application, user)
        break
      default:
        this.logger.warn(
          `Attempted to submit application with unknown type: ${application.applicationType}`,
        )
        throw new BadRequestException()
    }
  }
}

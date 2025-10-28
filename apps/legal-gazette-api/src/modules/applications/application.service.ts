import addDays from 'date-fns/addDays'
import { Op } from 'sequelize'

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
  ApplicationDto,
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
      signature: {
        name: application.signatureName,
        onBehalfOf: application.signatureOnBehalfOf,
        location: application.signatureLocation,
        date: application.signatureDate,
      },
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
      signatureName: requiredFields.signature?.name,
      signatureOnBehalfOf: requiredFields.signature?.onBehalfOf,
      signatureLocation: requiredFields.signature?.location,
      signatureDate: requiredFields.signature?.date?.toISOString(),
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
      signature: {
        name: application.signatureName,
        onBehalfOf: application.signatureOnBehalfOf,
        location: application.signatureLocation,
        date: application.signatureDate,
      },
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
      signatureName: requiredFields.signature?.name,
      signatureOnBehalfOf: requiredFields.signature?.onBehalfOf,
      signatureLocation: requiredFields.signature?.location,
      signatureDate: requiredFields.signature?.date?.toISOString(),
      title: title,
      divisionMeetingDate: requiredFields.divisionMeetingDate,
      divisionMeetingLocation: requiredFields.divisionMeetingLocation,
      judgementDate: requiredFields.judgementDate.toISOString(),
      courtDistrictId: requiredFields.courtDistrictId,
      settlement: {
        liquidatorName: requiredFields.liquidatorName,
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
      signatureName: body.signature?.name,
      signatureDate: body.signature?.date,
      signatureLocation: body.signature?.location,
      signatureOnBehalfOf: body.signature?.onBehalfOf,
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
      signatureName: body.signature?.name,
      signatureDate: body.signature?.date,
      signatureLocation: body.signature?.location,
      signatureOnBehalfOf: body.signature?.onBehalfOf,
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
      additionalText: body.additionalText,
      typeId: body.commonFields?.typeId,
      categoryId: body.commonFields?.categoryId,
      caption: body.commonFields?.caption,
      html: body.commonFields?.html,

      signatureDate: body.signature?.date
        ? new Date(body.signature.date)
        : undefined,
      signatureLocation: body.signature?.location,
      signatureName: body.signature?.name,
      signatureOnBehalfOf: body.signature?.onBehalfOf,

      courtDistrictId: body.courtAndJudgmentFields?.courtDistrictId,
      judgmentDate: body.courtAndJudgmentFields?.judgmentDate
        ? new Date(body.courtAndJudgmentFields.judgmentDate)
        : undefined,

      publishingDates: body.publishingDates?.map(
        ({ publishingDate }) => new Date(publishingDate),
      ),
      communicationChannels: body.communicationChannels,

      liquidatorName: body.liquidatorFields?.name,
      liquidatorLocation: body.liquidatorFields?.location,

      divisionMeetingDate: body.divisionMeetingFields?.meetingDate
        ? new Date(body.divisionMeetingFields.meetingDate)
        : undefined,
      divisionMeetingLocation: body.divisionMeetingFields?.meetingLocation,

      settlementName: body.settlementFields?.name,
      settlementNationalId: body.settlementFields?.nationalId,
      settlementAddress: body.settlementFields?.address,
      settlementDateOfDeath: body.settlementFields?.dateOfDeath
        ? new Date(body.settlementFields.dateOfDeath)
        : undefined,
      settlementDeadlineDate: body.settlementFields?.deadlineDate
        ? new Date(body.settlementFields.deadlineDate)
        : undefined,
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
  ): Promise<ApplicationDto> {
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

    await caseData.reload()

    const { application } = caseData

    if (!application) {
      throw new InternalServerErrorException('Failed to create application')
    }

    return application.fromModel()
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
        signature: {
          name: body.signatureName,
          onBehalfOf: body.signatureOnBehalfOf,
          location: body.signatureLocation,
          date: body.signatureDate,
        },
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
      signatureName: requiredFields.signature?.name,
      signatureDate: requiredFields.signature?.date?.toISOString(),
      signatureLocation: requiredFields.signature?.location,
      signatureOnBehalfOf: requiredFields.signature?.onBehalfOf,
      title: `${category.title} - ${requiredFields.caption}`,
      caption: requiredFields.caption,
      additionalText: requiredFields.additionalText,
      content: requiredFields.html,
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

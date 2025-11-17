import addDays from 'date-fns/addDays'
import { Op } from 'sequelize'
import z from 'zod'

import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import {
  INationalRegistryService,
  PersonDto,
} from '@dmr.is/clients/national-registry'
import {
  commonApplicationValidationSchema,
  recallApplicationValidationSchema,
} from '@dmr.is/legal-gazette/schemas'
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
} from '../../core/constants'
import { AdvertModel } from '../../models/advert.model'
import {
  AddDivisionEndingForApplicationDto,
  AddDivisionMeetingForApplicationDto,
  ApplicationDetailedDto,
  ApplicationDto,
  ApplicationModel,
  ApplicationStatusEnum,
  ApplicationTypeEnum,
  GetApplicationsDto,
  IslandIsSubmitCommonApplicationDto,
  UpdateApplicationDto,
} from '../../models/application.model'
import { CaseModel } from '../../models/case.model'
import {
  CategoryDefaultIdEnum,
  CategoryModel,
} from '../../models/category.model'
import {
  CommunicationChannelCreateAttributes,
  CommunicationChannelModel,
} from '../../models/communication-channel.model'
import { SettlementModel } from '../../models/settlement.model'
import { TypeIdEnum } from '../../models/type.model'
import { IAdvertService } from '../advert/advert.service.interface'
import { IApplicationService } from './application.service.interface'

@Injectable()
export class ApplicationService implements IApplicationService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IAdvertService)
    private readonly advertService: IAdvertService,
    @Inject(INationalRegistryService)
    private readonly nationalRegistryService: INationalRegistryService,
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
    submittee: PersonDto,
  ) {
    const check = commonApplicationValidationSchema.safeParse({
      signature: {
        name: application.signatureName,
        onBehalfOf: application.signatureOnBehalfOf,
        location: application.signatureLocation,
        date: application.signatureDate?.toISOString(),
      },
      publishingDates: application.publishingDates.map((d) => ({
        publishingDate: d.toISOString(),
      })),
      communicationChannels: application.communicationChannels,
      fields: {
        type: application.applicationType,
        typeId: application.typeId,
        categoryId: application.categoryId,
        caption: application.caption,
        additionalText: application.additionalText,
        html: application.html,
      },
    })

    if (!check.success) {
      const formattedErrors = z.treeifyError(check.error)
      this.logger.warn(
        `Failed to validate common application before submission`,
        {
          errors: formattedErrors,
        },
      )
      throw new BadRequestException('Invalid application data')
    }

    const requiredFields = check.data

    const title =
      requiredFields.fields.typeId === TypeIdEnum.DIVISION_MEETING
        ? `Skipta/veðhafafundur`
        : `${application.category?.title} - ${requiredFields.fields.caption}`

    await this.advertService.createAdvert({
      caseId: application.caseId,
      typeId: requiredFields.fields.typeId,
      categoryId: requiredFields.fields.categoryId,
      caption: requiredFields.fields.caption,
      additionalText: requiredFields.additionalText,
      createdBy: submittee.nafn,
      createdByNationalId: submittee.kennitala,
      signatureName: requiredFields.signature?.name,
      signatureOnBehalfOf: requiredFields.signature?.onBehalfOf,
      signatureLocation: requiredFields.signature?.location,
      signatureDate: requiredFields.signature?.date ?? undefined,
      content: requiredFields.fields.html,
      title: title,
      communicationChannels: requiredFields.communicationChannels,
      scheduledAt: requiredFields.publishingDates.map(
        ({ publishingDate }) => publishingDate,
      ),
    })

    await application.update({ status: ApplicationStatusEnum.FINISHED })
  }

  private async submitRecallApplication(
    application: ApplicationModel,
    submittee: PersonDto,
  ) {
    const check = recallApplicationValidationSchema.safeParse({
      signature: {
        name: application.signatureName,
        onBehalfOf: application.signatureOnBehalfOf,
        location: application.signatureLocation,
        date: application.signatureDate?.toISOString(),
      },
      publishingDates: application.publishingDates.map((d) => ({
        publishingDate: d.toISOString(),
      })),
      communicationChannels: application.communicationChannels,
      fields: {
        type: application.applicationType,
        courtAndJudgmentFields: {
          courtDistrictId: application.courtDistrictId,
          judgmentDate: application.judgmentDate?.toISOString(),
        },
        settlementFields: {
          name: application.settlementName,
          nationalId: application.settlementNationalId,
          address: application.settlementAddress,
          dateOfDeath: application.settlementDateOfDeath?.toISOString(),
          deadlineDate: application.settlementDeadlineDate?.toISOString(),
        },
        liquidatorFields: {
          name: application.liquidatorName,
          location: application.liquidatorLocation,
          recallRequirementStatementLocation:
            application.liquidatorRecallStatementLocation,
          recallRequirementStatementType:
            application.liquidatorRecallStatementType,
        },
        divisionMeetingFields: {
          meetingDate: application.divisionMeetingDate?.toISOString(),
          meetingLocation: application.divisionMeetingLocation,
        },
      },
    })

    if (!check.success) {
      const formattedErrors = z.treeifyError(check.error)
      this.logger.warn(
        `Failed to validate recall application before submission`,
        {
          errors: formattedErrors,
        },
      )
      throw new BadRequestException('Invalid application data')
    }

    const requiredFields = check.data

    const title =
      application.applicationType === ApplicationTypeEnum.RECALL_BANKRUPTCY
        ? `Innköllun þrotabús - ${requiredFields.fields.settlementFields.name}`
        : `Innköllun dánarbús - ${requiredFields.fields.settlementFields.name}`

    await this.advertService.createAdvert({
      caseId: application.caseId,
      typeId:
        requiredFields.fields.type === ApplicationTypeEnum.RECALL_BANKRUPTCY
          ? RECALL_BANKRUPTCY_ADVERT_TYPE_ID
          : RECALL_DECEASED_ADVERT_TYPE_ID,
      categoryId: RECALL_CATEGORY_ID,
      createdBy: submittee.nafn,
      createdByNationalId: submittee.kennitala,
      signatureName: requiredFields.signature?.name,
      signatureOnBehalfOf: requiredFields.signature?.onBehalfOf,
      signatureLocation: requiredFields.signature?.location,
      signatureDate: requiredFields.signature?.date ?? undefined,
      title: title,
      divisionMeetingDate:
        requiredFields.fields.divisionMeetingFields?.meetingDate,
      divisionMeetingLocation:
        requiredFields.fields.divisionMeetingFields?.meetingLocation,
      judgementDate: requiredFields.fields.courtAndJudgmentFields?.judgmentDate,
      courtDistrictId:
        requiredFields.fields.courtAndJudgmentFields?.courtDistrictId,
      settlement: {
        liquidatorName: requiredFields.fields.liquidatorFields?.name,
        liquidatorLocation: requiredFields.fields.liquidatorFields?.location,
        liquidatorRecallStatementType:
          requiredFields.fields.liquidatorFields
            ?.recallRequirementStatementType,
        liquidatorRecallStatementLocation:
          requiredFields.fields.liquidatorFields
            ?.recallRequirementStatementLocation,
        settlementAddress: requiredFields.fields.settlementFields?.address,
        settlementName: requiredFields.fields.settlementFields?.name,
        settlementNationalId:
          requiredFields.fields.settlementFields?.nationalId,
        settlementDateOfDeath:
          application.applicationType === ApplicationTypeEnum.RECALL_DECEASED
            ? application.settlementDateOfDeath?.toISOString()
            : undefined,
        settlementDeadline:
          application.applicationType === ApplicationTypeEnum.RECALL_BANKRUPTCY
            ? application.settlementDeadlineDate?.toISOString()
            : undefined,
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
      divisionMeetingDate: body.meetingDate,
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
      courtDistrictId:
        body.recallFields?.courtAndJudgmentFields?.courtDistrictId,
      judgmentDate: body.recallFields?.courtAndJudgmentFields?.judgmentDate
        ? new Date(body.recallFields.courtAndJudgmentFields.judgmentDate)
        : undefined,
      publishingDates: body.publishingDates?.map(
        ({ publishingDate }) => new Date(publishingDate),
      ),
      communicationChannels: body.communicationChannels,
      liquidatorName: body.recallFields?.liquidatorFields?.name,
      liquidatorLocation: body.recallFields?.liquidatorFields?.location,
      liquidatorRecallStatementLocation:
        body.recallFields?.liquidatorFields?.recallRequirementStatementLocation,
      liquidatorRecallStatementType:
        body.recallFields?.liquidatorFields?.recallRequirementStatementType,
      divisionMeetingDate: body.recallFields?.divisionMeetingFields?.meetingDate
        ? new Date(body.recallFields.divisionMeetingFields.meetingDate)
        : undefined,
      divisionMeetingLocation:
        body.recallFields?.divisionMeetingFields?.meetingLocation,
      settlementName: body.recallFields?.settlementFields?.name,
      settlementNationalId: body.recallFields?.settlementFields?.nationalId,
      settlementAddress: body.recallFields?.settlementFields?.address,
      settlementDateOfDeath: body.recallFields?.settlementFields?.dateOfDeath
        ? new Date(body.recallFields?.settlementFields.dateOfDeath)
        : undefined,
      settlementDeadlineDate: body.recallFields?.settlementFields?.deadlineDate
        ? new Date(body.recallFields?.settlementFields.deadlineDate)
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
  ): Promise<GetApplicationsDto> {
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

    return { applications: mapped, paging: paging }
  }

  async submitIslandIsApplication(
    body: IslandIsSubmitCommonApplicationDto,
    user: DMRUser,
  ): Promise<void> {
    const newCase = await this.caseModel.create(
      { involvedPartyNationalId: user.nationalId },
      { returning: ['id'] },
    )

    const category = await this.categoryModel.findByPkOrThrow(body.categoryId)

    await this.advertService.createAdvert({
      caseId: newCase.id,
      typeId: body.typeId,
      categoryId: body.categoryId,
      islandIsApplicationId: body.islandIsApplicationId,
      createdBy: user.fullName,
      createdByNationalId: user.nationalId,
      signatureName: body.signature.name,
      signatureDate: body.signature.date,
      signatureLocation: body.signature.location,
      signatureOnBehalfOf: body.signature.onBehalfOf,
      title: `${category.title} - ${body.caption}`,
      caption: body.caption,
      additionalText: body.additionalText,
      content: body.html,
      communicationChannels: body.communicationChannels,
      scheduledAt: body.publishingDates,
    })
  }
  async submitApplication(applicationId: string, user: DMRUser): Promise<void> {
    const application = await this.applicationModel.findOneOrThrow({
      where: { id: applicationId, submittedByNationalId: user.nationalId },
    })

    const { person: submittee } =
      await this.nationalRegistryService.getPersonByNationalId(user.nationalId)

    if (!submittee) {
      this.logger.warn(`Could not find submittee in national registry`, {
        context: 'ApplicationService',
        category: 'legal-gazette',
      })
      throw new InternalServerErrorException('Could not verify submittee')
    }

    switch (application.applicationType) {
      case ApplicationTypeEnum.COMMON:
        await this.submitCommonApplication(application, submittee)
        break
      case ApplicationTypeEnum.RECALL_BANKRUPTCY:
      case ApplicationTypeEnum.RECALL_DECEASED:
        await this.submitRecallApplication(application, submittee)
        break
      default:
        this.logger.warn(
          `Attempted to submit application with unknown type: ${application.applicationType}`,
        )
        throw new BadRequestException()
    }
  }
}

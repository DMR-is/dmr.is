import addDays from 'date-fns/addDays'

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
  createCommonAdvertFromApplicationSchema,
  createCommonAdvertFromIslandIsApplicationSchema,
  createRecallAdvertFromApplicationSchema,
} from '../../lib/schemas'
import { mapIndexToVersion } from '../../lib/utils'
import { AdvertModel } from '../advert/advert.model'
import { CaseModel } from '../case/case.model'
import { CaseDto } from '../case/dto/case.dto'
import { CategoryDefaultIdEnum } from '../category/category.model'
import { SettlementModel } from '../settlement/settlement.model'
import { TypeIdEnum } from '../type/type.model'
import {
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
    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,
    @InjectModel(SettlementModel)
    private readonly settlementModel: typeof SettlementModel,
    @InjectModel(AdvertModel) private readonly advertModel: typeof AdvertModel,
    @InjectModel(ApplicationModel)
    private readonly applicationModel: typeof ApplicationModel,
  ) {}

  private async submitCommonApplication(applicationId: string, user: DMRUser) {
    const application = await this.applicationModel.findOne({
      where: { id: applicationId, submittedByNationalId: user.nationalId },
    })

    if (!application) {
      this.logger.warn('Application not found or does not belong to user', {
        applicationId,
      })
      throw new NotFoundException()
    }

    const applicationCase = await this.caseModel.unscoped().findOne({
      attributes: ['id'],
      where: {
        id: application.caseId,
        involvedPartyNationalId: user.nationalId,
      },
    })

    if (!applicationCase) {
      this.logger.error('Case does not have an application', {
        applicationId: applicationId,
      })
      throw new InternalServerErrorException()
    }

    const parsedApplication = createCommonAdvertFromApplicationSchema.safeParse(
      {
        caseId: applicationCase.id,
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
      },
    )

    if (!parsedApplication.success) {
      this.logger.warn('Invalid application data', {
        caseId: applicationCase.id,
        applicationId: application.id,
        errors: parsedApplication.error,
      })
      throw new BadRequestException('Invalid application data')
    }

    await this.advertModel.bulkCreate(
      parsedApplication.data.publishingDates.map((scheduledAt, i) => ({
        typeId: TypeIdEnum.COMMON_ADVERT,
        caption: parsedApplication.data.caption,
        version: mapIndexToVersion(i),
        caseId: parsedApplication.data.caseId,
        categoryId: parsedApplication.data.category.id,
        additionalText: parsedApplication.data.additionalText,
        createdBy: user.fullName,
        scheduledAt: scheduledAt,
        signatureName: parsedApplication.data.signatureName,
        signatureOnBehalfOf: parsedApplication.data.signatureOnBehalfOf,
        signatureLocation: parsedApplication.data.signatureLocation,
        signatureDate: parsedApplication.data.signatureDate,
        title: `${parsedApplication.data.category.title} - ${parsedApplication.data.caption}`,
      })),
    )

    await application.update({ status: ApplicationStatusEnum.SUBMITTED })
  }

  private async submitRecallApplication(applicationId: string, user: DMRUser) {
    const application = await this.applicationModel.findOne({
      where: { id: applicationId, submittedByNationalId: user.nationalId },
    })

    if (!application) {
      this.logger.warn('Application not found or does not belong to user', {
        applicationId,
      })
      throw new NotFoundException()
    }

    const applicationCase = await this.caseModel.unscoped().findOne({
      attributes: ['id'],
      where: {
        id: application.caseId,
        involvedPartyNationalId: user.nationalId,
      },
      include: [{ model: ApplicationModel, as: 'application' }],
    })

    if (!applicationCase) {
      this.logger.error('Case does not have an application', {
        applicationId: applicationId,
      })
      throw new InternalServerErrorException()
    }

    const requiredFields = createRecallAdvertFromApplicationSchema.safeParse({
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
    })

    if (!requiredFields.success) {
      this.logger.warn('Invalid application data', {
        caseId: applicationCase.id,
        applicationId: application.id,
        errors: requiredFields.error,
      })
      throw new BadRequestException('Invalid application data')
    }

    const applicationType = application.applicationType
    const isBankruptcy =
      applicationType === ApplicationTypeEnum.RECALL_BANKRUPTCY

    if (isBankruptcy && !requiredFields.data.settlementDeadlineDate) {
      throw new BadRequestException(
        'Settlement deadline date is required for bankruptcy recall applications',
      )
    }

    if (!isBankruptcy && !requiredFields.data.settlementDateOfDeath) {
      throw new BadRequestException(
        'Settlement date of death is required for bankruptcy recall applications',
      )
    }

    const { data } = requiredFields

    const settlement = await this.settlementModel.create(
      {
        liquidatorName: data.signatureName,
        liquidatorLocation: data.liquidatorLocation,
        settlementAddress: data.settlementAddress,
        settlementName: data.settlementName,
        settlementNationalId: data.settlementNationalId,
        settlementDateOfDeath: data.settlementDateOfDeath,
        settlementDeadline: data.settlementDeadlineDate,
      },
      { returning: ['id'] },
    )

    const categoryId = isBankruptcy
      ? CategoryDefaultIdEnum.BANKRUPTCY_RECALL
      : CategoryDefaultIdEnum.DECEASED_RECALL

    const title = isBankruptcy
      ? `Innköllun þrotabús - ${data.settlementName}`
      : `Innköllun dánarbús - ${data.settlementName}`

    await this.advertModel.bulkCreate(
      application.publishingDates.map((scheduledAt, i) => ({
        caseId: applicationCase.id,
        categoryId: categoryId,
        scheduledAt: scheduledAt,
        typeId: TypeIdEnum.RECALL,
        createdBy: user.fullName,
        version: mapIndexToVersion(i),
        signatureName: data.signatureName,
        signatureOnBehalfOf: data.signatureOnBehalfOf,
        signatureLocation: data.signatureLocation,
        signatureDate: data.signatureDate,
        title: title,
        settlementId: settlement.id,
      })),
    )

    if (
      application.divisionMeetingDate &&
      application.divisionMeetingLocation
    ) {
      await this.advertModel.create({
        caseId: applicationCase.id,
        categoryId: isBankruptcy
          ? CategoryDefaultIdEnum.BANKRUPTCY_DIVISION_MEETING
          : CategoryDefaultIdEnum.DECEASED_DIVISION_MEETING,
        createdBy: user.fullName,
        scheduledAt: application.divisionMeetingDate,
        signatureName: data.signatureName,
        signatureDate: data.signatureDate,
        signatureLocation: data.signatureLocation,
        signatureOnBehalfOf: data.signatureOnBehalfOf,
        typeId: TypeIdEnum.DIVISION_MEETING,
        title: `Skiptafundur - ${data.settlementName}`,
        settlementId: settlement.id,
      })
    }

    await application.update({ status: ApplicationStatusEnum.SUBMITTED })
  }

  async addDivisionMeetingAdvertToApplication(
    applicationId: string,
    body: AddDivisionMeetingForApplicationDto,
    user: DMRUser,
  ): Promise<void> {
    const application = await this.applicationModel.findOne({
      where: { id: applicationId, submittedByNationalId: user.nationalId },
    })

    if (!application) {
      throw new NotFoundException()
    }

    if (application.status !== ApplicationStatusEnum.SUBMITTED) {
      throw new BadRequestException(
        'Only submitted applications can have adverts added to them',
      )
    }

    if (
      application.applicationType !== ApplicationTypeEnum.RECALL_BANKRUPTCY &&
      application.applicationType !== ApplicationTypeEnum.RECALL_DECEASED
    ) {
      throw new BadRequestException(
        'Only recall applications can have division meeting adverts added to them',
      )
    }

    const currentRecallAdverts = await this.advertModel.unscoped().findAll({
      where: {
        caseId: application.caseId,
        typeId: TypeIdEnum.RECALL,
      },
      include: [{ model: SettlementModel, as: 'settlement' }],
    })

    if (currentRecallAdverts.length === 0) {
      throw new BadRequestException(
        'A recall advert must be added to the application before a division meeting advert can be added',
      )
    }

    const currentDivisionMeetingAdverts = await this.advertModel
      .unscoped()
      .findAll({
        where: {
          caseId: application.caseId,
          typeId: TypeIdEnum.DIVISION_MEETING,
        },
      })

    if (currentDivisionMeetingAdverts.length === 0) {
      const latestRecallAdvert =
        currentRecallAdverts[currentRecallAdverts.length - 1]

      const categoryId =
        application.applicationType === ApplicationTypeEnum.RECALL_BANKRUPTCY
          ? CategoryDefaultIdEnum.BANKRUPTCY_DIVISION_MEETING
          : CategoryDefaultIdEnum.DECEASED_DIVISION_MEETING

      await this.advertModel.create({
        caseId: application.caseId,
        categoryId: categoryId,
        createdBy: user.fullName,
        scheduledAt: new Date(body.meetingDate),
        signatureName: latestRecallAdvert.signatureName,
        signatureOnBehalfOf: latestRecallAdvert.signatureOnBehalfOf,
        signatureDate: new Date(body.signatureDate),
        signatureLocation: body.signatureLocation,
        typeId: TypeIdEnum.DIVISION_MEETING,
        title: `Skiptafundur - ${application.settlementName}`,
        settlementId: latestRecallAdvert.settlementId,
      })
    }

    if (currentDivisionMeetingAdverts.length >= 3) {
      throw new BadRequestException(
        'A maximum of 3 division meeting adverts can be added to an application',
      )
    }

    // find the advert with the youngest scheduledAt date
    const lastAdvert = currentDivisionMeetingAdverts.reduce(
      (prev, current) =>
        prev.scheduledAt > current.scheduledAt ? prev : current,
      currentDivisionMeetingAdverts[0],
    )

    const meetingDate = new Date(body.meetingDate)
    if (meetingDate < lastAdvert.scheduledAt) {
      throw new BadRequestException(
        'New division meeting advert must be scheduled after the last one',
      )
    }

    await this.advertModel.create({
      caseId: application.caseId,
      categoryId:
        application.applicationType === ApplicationTypeEnum.RECALL_BANKRUPTCY
          ? CategoryDefaultIdEnum.BANKRUPTCY_DIVISION_MEETING
          : CategoryDefaultIdEnum.DECEASED_DIVISION_MEETING,
      createdBy: user.fullName,
      scheduledAt: meetingDate,
      signatureName: lastAdvert.signatureName,
      signatureDate: new Date(body.signatureDate),
      signatureLocation: body.signatureLocation,
      signatureOnBehalfOf: lastAdvert.signatureOnBehalfOf,
      typeId: TypeIdEnum.DIVISION_MEETING,
      title: `Skiptafundur - ${application.settlementName}`,
      settlementId: lastAdvert.settlementId,
    })
  }
  addDivisionEndingAdvertToApplication(
    applicationId: string,
    user: DMRUser,
  ): Promise<void> {
    throw new Error('Method not implemented.')
  }
  addRecallAdvertToApplication(
    applicationId: string,
    user: DMRUser,
  ): Promise<void> {
    throw new Error('Method not implemented.')
  }
  addCommonAdvertToApplication(
    applicationId: string,
    user: DMRUser,
  ): Promise<void> {
    throw new Error('Method not implemented.')
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
    const categoryId =
      applicationType === ApplicationTypeEnum.COMMON
        ? null
        : applicationType === ApplicationTypeEnum.RECALL_BANKRUPTCY
          ? CategoryDefaultIdEnum.BANKRUPTCY_RECALL
          : CategoryDefaultIdEnum.DECEASED_RECALL

    const caseData = await this.caseModel.create(
      {
        involvedPartyNationalId: user.nationalId,
        application: {
          categoryId: categoryId,
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
    const parsedApplication =
      createCommonAdvertFromIslandIsApplicationSchema.safeParse({
        islandIsApplicationId: body.islandIsApplicationId,
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

    // return this.submitCommonApplication(createdCase, user)
  }
  async submitApplication(applicationId: string, user: DMRUser): Promise<void> {
    const application = await this.applicationModel.unscoped().findOne({
      attributes: ['id', 'applicationType'],
      where: { id: applicationId, submittedByNationalId: user.nationalId },
    })

    if (!application) {
      this.logger.warn('Application not found or does not belong to user', {
        applicationId,
      })
      throw new NotFoundException()
    }

    switch (application.applicationType) {
      case ApplicationTypeEnum.COMMON:
        await this.submitCommonApplication(applicationId, user)
        break
      case ApplicationTypeEnum.RECALL_BANKRUPTCY:
      case ApplicationTypeEnum.RECALL_DECEASED:
        await this.submitRecallApplication(applicationId, user)
        break
      default:
        this.logger.warn(
          `Attempted to submit application with unknown type: ${application.applicationType}`,
        )
        throw new BadRequestException()
    }

    this.logger.debug('Application successfully submitted', {
      applicationId: application.id,
      caseId: application.caseId,
    })
  }
}

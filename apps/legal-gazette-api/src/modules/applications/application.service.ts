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
} from '../../lib/schemas'
import {
  getCommonAdvertHTMLTemplate,
  getDivisionMeetingAdvertHTMLTemplate,
} from '../../lib/templates'
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
    @InjectModel(AdvertModel) private readonly advertModel: typeof AdvertModel,
    @InjectModel(ApplicationModel)
    private readonly applicationModel: typeof ApplicationModel,
  ) {}
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

    const newMeetingAdvert = await this.advertModel.create({
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

  private async submitCommonApplication(
    applicationCase: CaseModel,
    user: DMRUser,
  ) {
    if (!applicationCase.application) {
      this.logger.error('Case does not have an application', {
        caseId: applicationCase.id,
      })
      throw new InternalServerErrorException()
    }

    const applicationId = applicationCase.application.id

    const parsedApplication = createCommonAdvertFromApplicationSchema.safeParse(
      {
        caseId: applicationCase.id,
        category: applicationCase.application.category,
        caption: applicationCase.application.caption,
        additionalText: applicationCase.application.additionalText,
        html: applicationCase.application.html,
        signatureName: applicationCase.application.signatureName,
        signatureOnBehalfOf: applicationCase.application.signatureOnBehalfOf,
        signatureLocation: applicationCase.application.signatureLocation,
        signatureDate: applicationCase.application.signatureDate,
        communicationChannels:
          applicationCase.application.communicationChannels,
        publishingDates: applicationCase.application.publishingDates,
      },
    )

    if (!parsedApplication.success) {
      this.logger.warn('Invalid application data', {
        caseId: applicationCase.id,
        applicationId: applicationCase.application.id,
        errors: parsedApplication.error,
      })
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
        signatureName: parsedApplication.data.signatureName,
        signatureOnBehalfOf: parsedApplication.data.signatureOnBehalfOf,
        signatureLocation: parsedApplication.data.signatureLocation,
        signatureDate: parsedApplication.data.signatureDate,
        title: `${parsedApplication.data.category.title} - ${parsedApplication.data.caption}`,
      })),
    )

    await this.applicationModel.update(
      { status: ApplicationStatusEnum.SUBMITTED },
      { where: { id: applicationId } },
    )
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

    return this.submitCommonApplication(createdCase, user)
  }
  async submitApplication(applicationId: string, user: DMRUser): Promise<void> {
    const applicationCase = await this.caseModel.unscoped().findOne({
      attributes: ['id', 'caseNumber'],
      include: [{ model: ApplicationModel, where: { id: applicationId } }],
    })

    if (!applicationCase || !applicationCase.application) {
      throw new NotFoundException()
    }

    switch (applicationCase.application.applicationType) {
      case ApplicationTypeEnum.COMMON:
        return this.submitCommonApplication(applicationCase, user)
      default:
        this.logger.warn(
          `Attempted to submit application with unknown type: ${applicationCase.application.applicationType}`,
        )
        throw new BadRequestException()
    }
  }
}

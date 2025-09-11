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
  createCommonAdvertFromApplicationSchema,
  createCommonAdvertFromIslandIsApplicationSchema,
  createRecallAdvertFromApplicationSchema,
} from '../../lib/schemas'
import { AdvertModel } from '../advert/advert.model'
import { AdvertPublicationModel } from '../advert-publications/advert-publication.model'
import { CaseModel } from '../case/case.model'
import { CaseDto } from '../case/dto/case.dto'
import {
  CategoryDefaultIdEnum,
  CategoryModel,
} from '../category/category.model'
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
    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,
    @InjectModel(AdvertModel) private readonly advertModel: typeof AdvertModel,
    @InjectModel(ApplicationModel)
    private readonly applicationModel: typeof ApplicationModel,
    @InjectModel(CategoryModel)
    private readonly categoryModel: typeof CategoryModel,
    @InjectModel(AdvertPublicationModel)
    private readonly publicationModel: typeof AdvertPublicationModel,
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

    const advert = await this.advertModel.create(
      {
        caseId: requiredFields.caseId,
        typeId: requiredFields.type.id,
        caption: requiredFields.caption,
        categoryId: requiredFields.category.id,
        additionalText: requiredFields.additionalText,
        createdBy: user.fullName,
        signatureName: requiredFields.signatureName,
        signatureOnBehalfOf: requiredFields.signatureOnBehalfOf,
        signatureLocation: requiredFields.signatureLocation,
        signatureDate: requiredFields.signatureDate,
        content: requiredFields.html,
        title: `${requiredFields.category.title} - ${requiredFields.caption}`,
      },
      { returning: ['id'] },
    )

    await this.publicationModel.bulkCreate(
      requiredFields.publishingDates.map((d, i) => ({
        advertId: advert.id,
        scheduledAt: d,
        versionNumber: i + 1,
      })),
    )

    await application.update({ status: ApplicationStatusEnum.SUBMITTED })
  }

  private async submitRecallApplication(
    application: ApplicationModel,
    user: DMRUser,
  ) {
    const requiredFields = createRecallAdvertFromApplicationSchema.parse({
      type: application.type,
      category: application.category,
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

    const advert = await this.advertModel.create(
      {
        caseId: application.caseId,
        typeId: requiredFields.type.id,
        categoryId: requiredFields.category.id,
        createdBy: user.fullName,
        signatureName: requiredFields.signatureName,
        signatureOnBehalfOf: requiredFields.signatureOnBehalfOf,
        signatureLocation: requiredFields.signatureLocation,
        signatureDate: requiredFields.signatureDate,
        title: title,
        divisionMeetingDate: requiredFields.divisionMeetingDate,
        divisionMeetingLocation: requiredFields.divisionMeetingLocation,
        judgementDate: requiredFields.judgementDate,
        courtDistrictId: requiredFields.courtDistrictId,
        settlement: {
          liquidatorName: requiredFields.signatureName,
          liquidatorLocation: requiredFields.liquidatorLocation,
          settlementAddress: requiredFields.settlementAddress,
          settlementName: requiredFields.settlementName,
          settlementNationalId: requiredFields.settlementNationalId,
          settlementDateOfDeath: requiredFields.settlementDateOfDeath ?? null,
          settlementDeadline: requiredFields.settlementDeadlineDate ?? null,
        },
      },
      { returning: ['id'], include: [SettlementModel] },
    )

    await this.publicationModel.bulkCreate(
      application.publishingDates.map((d, i) => ({
        advertId: advert.id,
        scheduledAt: d,
        versionNumber: i + 1,
      })),
    )

    await application.update({ status: ApplicationStatusEnum.FINISHED })
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
        status: ApplicationStatusEnum.SUBMITTED,
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

    const newAdvert = await this.advertModel.create(
      {
        caseId: application.caseId,
        categoryId:
          application.applicationType === ApplicationTypeEnum.RECALL_BANKRUPTCY
            ? CategoryDefaultIdEnum.BANKRUPTCY_DIVISION_MEETING
            : CategoryDefaultIdEnum.DECEASED_DIVISION_MEETING,
        createdBy: user.fullName,
        signatureName: body.signatureName,
        signatureDate: new Date(body.signatureDate),
        signatureLocation: body.signatureLocation,
        signatureOnBehalfOf: body.signatureOnBehalfOf,
        divisionMeetingDate: new Date(body.meetingDate),
        divisionMeetingLocation: body.meetingLocation,
        typeId: TypeIdEnum.DIVISION_MEETING,
        title: `Skiptafundur - ${application.settlementName}`,
        additionalText: body.additionalText,
        settlementId: settlement.settlementId,
      },
      { returning: ['id'] },
    )

    await this.publicationModel.create({
      scheduledAt: new Date(body.meetingDate),
      advertId: newAdvert.id,
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

    const newAdvert = await this.advertModel.create(
      {
        caseId: application.caseId,
        categoryId: CategoryDefaultIdEnum.DIVISION_ENDING,
        createdBy: user.fullName,
        signatureName: body.signatureName,
        signatureDate: new Date(body.signatureDate),
        signatureLocation: body.signatureLocation,
        signatureOnBehalfOf: body.signatureOnBehalfOf,
        typeId: TypeIdEnum.DIVISION_ENDING,
        title: `Skiptalok - ${application.settlementName}`,
        additionalText: body.additionalText,
        settlementId: settlement.id,
      },
      { returning: ['id'] },
    )

    await this.publicationModel.create({
      scheduledAt: new Date(body.scheduledAt),
      advertId: newAdvert.id,
    })

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

    await this.advertModel.create({
      caseId: newCase.id,
      typeId: TypeIdEnum.COMMON_ADVERT,
      categoryId: requiredFields.categoryId,
      islandIsApplicationId: requiredFields.islandIsApplicationId,
      createdBy: user.fullName,
      signatureDate: requiredFields.signatureDate,
      signatureLocation: requiredFields.signatureLocation,
      signatureName: requiredFields.signatureName,
      title: `${category.title} - ${requiredFields.caption}`,
      caption: requiredFields.caption,
      additionalText: requiredFields.additionalText,
      content: requiredFields.html,
      signatureOnBehalfOf: requiredFields.signatureOnBehalfOf,
      publications: body.publishingDates.map((scheduledAt) => ({
        scheduledAt: new Date(scheduledAt),
      })),
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

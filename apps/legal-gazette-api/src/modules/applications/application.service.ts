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
  ApplicationTypeEnum,
  commonApplicationSchema,
  commonApplicationValidationSchema,
  isValidatedRecallBankruptcyApplication,
  isValidatedRecallDeceasedApplication,
  recallApplicationSchema,
  recallApplicationValidationSchema,
  updateApplicationSchema,
} from '@dmr.is/legal-gazette/schemas'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { PagingQuery } from '@dmr.is/shared/dto'
import { generatePaging, getLimitAndOffset } from '@dmr.is/utils'

import {
  RECALL_BANKRUPTCY_ADVERT_TYPE_ID,
  RECALL_CATEGORY_ID,
  RECALL_DECEASED_ADVERT_TYPE_ID,
} from '../../core/constants'
import { AdvertTemplateType } from '../../models/advert.model'
import {
  ApplicationDetailedDto,
  ApplicationDto,
  ApplicationModel,
  ApplicationStatusEnum,
  CreateDivisionEndingDto,
  CreateDivisionMeetingDto,
  GetApplicationsDto,
  IslandIsSubmitApplicationDto,
  UpdateApplicationDto,
} from '../../models/application.model'
import { CaseModel } from '../../models/case.model'
import {
  CategoryDefaultIdEnum,
  CategoryModel,
} from '../../models/category.model'
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
    @InjectModel(ApplicationModel)
    private readonly applicationModel: typeof ApplicationModel,
    @InjectModel(CategoryModel)
    private readonly categoryModel: typeof CategoryModel,
  ) {}

  private async submitCommonApplication(
    application: ApplicationModel,
    submittee: PersonDto,
  ) {
    const parsedApplication = commonApplicationValidationSchema.parse(
      application.answers,
    )

    const category = await this.categoryModel.findByPkOrThrow(
      parsedApplication.answers.categoryId,
    )

    await this.advertService.createAdvert({
      caseId: application.caseId,
      applicationId: application.id,
      createdBy: submittee.nafn,
      createdByNationalId: submittee.kennitala,
      typeId: parsedApplication.answers.typeId,
      categoryId: parsedApplication.answers.categoryId,
      caption: parsedApplication.answers.caption,
      additionalText: parsedApplication.additionalText,
      signatureName: parsedApplication.signature?.name,
      signatureOnBehalfOf: parsedApplication.signature?.onBehalfOf,
      signatureLocation: parsedApplication.signature?.location,
      signatureDate: parsedApplication.signature?.date,
      content: parsedApplication.answers.html,
      title: `${category.title} - ${parsedApplication.answers.caption}`,
      communicationChannels: parsedApplication.communicationChannels,
      scheduledAt: parsedApplication.publishingDates,
    })

    await application.update({ status: ApplicationStatusEnum.FINISHED })
  }

  private async submitRecallApplication(
    application: ApplicationModel,
    submittee: PersonDto,
  ) {
    const parsedApplication = recallApplicationValidationSchema.parse(
      application.answers,
    )

    const title =
      application.type === ApplicationTypeEnum.RECALL_BANKRUPTCY
        ? `Innköllun þrotabús - ${parsedApplication.answers.settlementFields.name}`
        : `Innköllun dánarbús - ${parsedApplication.answers.settlementFields.name}`

    const createObj = {
      applicationId: application.id,
      templateType:
        application.type === ApplicationTypeEnum.RECALL_BANKRUPTCY
          ? AdvertTemplateType.RECALL_BANKRUPTCY
          : AdvertTemplateType.RECALL_DECEASED,
      caseId: application.caseId,
      typeId:
        application.type === ApplicationTypeEnum.RECALL_BANKRUPTCY
          ? RECALL_BANKRUPTCY_ADVERT_TYPE_ID
          : RECALL_DECEASED_ADVERT_TYPE_ID,
      categoryId: RECALL_CATEGORY_ID,
      createdBy: submittee.nafn,
      createdByNationalId: submittee.kennitala,
      signatureName: parsedApplication.signature?.name,
      signatureOnBehalfOf: parsedApplication.signature?.onBehalfOf,
      signatureLocation: parsedApplication.signature?.location,
      signatureDate: parsedApplication.signature?.date ?? undefined,
      title: title,
      divisionMeetingDate:
        parsedApplication.answers.divisionMeetingFields?.meetingDate,
      divisionMeetingLocation:
        parsedApplication.answers.divisionMeetingFields?.meetingLocation,
      judgementDate:
        parsedApplication.answers.courtAndJudgmentFields?.judgmentDate,
      courtDistrictId:
        parsedApplication.answers.courtAndJudgmentFields?.courtDistrictId,
      communicationChannels: parsedApplication.communicationChannels,
      scheduledAt: parsedApplication.publishingDates,
    }

    if (isValidatedRecallBankruptcyApplication(parsedApplication)) {
      Object.assign(createObj, {
        settlement: {
          ...parsedApplication.answers.settlementFields,
          deadlineDate: parsedApplication.answers.settlementFields.deadlineDate,
        },
      })
    }

    if (isValidatedRecallDeceasedApplication(parsedApplication)) {
      const deceasedFields = parsedApplication.answers.settlementFields
      Object.assign(createObj, {
        settlement: {
          ...deceasedFields,
          dateOfDeath: deceasedFields.dateOfDeath,
        },
      })
    }

    const advert = await this.advertService.createAdvert(createObj)

    await application.update({
      status: ApplicationStatusEnum.SUBMITTED,
      settlementId: advert.settlement?.id,
    })
  }

  async addDivisionMeetingAdvertToApplication(
    applicationId: string,
    body: CreateDivisionMeetingDto,
    submittee: PersonDto,
  ): Promise<void> {
    const application = await this.applicationModel.findOneOrThrow({
      where: {
        id: applicationId,
        submittedByNationalId: submittee.kennitala,
        status: ApplicationStatusEnum.SUBMITTED,
        type: {
          [Op.or]: [
            ApplicationTypeEnum.RECALL_BANKRUPTCY,
            ApplicationTypeEnum.RECALL_DECEASED,
          ],
        },
      },
    })

    await this.advertService.createAdvert({
      applicationId: application.id,
      templateType:
        application.type === ApplicationTypeEnum.RECALL_BANKRUPTCY
          ? AdvertTemplateType.DIVISION_MEETING_BANKRUPTCY
          : AdvertTemplateType.DIVISION_MEETING_DECEASED,
      caseId: application.caseId,
      categoryId: CategoryDefaultIdEnum.DIVISION_MEETINGS,
      createdBy: submittee.nafn,
      createdByNationalId: submittee.kennitala,
      signatureName: body.signature?.name,
      signatureDate: body.signature?.date,
      signatureLocation: body.signature?.location,
      signatureOnBehalfOf: body.signature?.onBehalfOf,
      divisionMeetingDate: body.meetingDate,
      divisionMeetingLocation: body.meetingLocation,
      typeId: TypeIdEnum.DIVISION_MEETING,
      title: `Skiptafundur - ${application.settlement?.name}`,
      additionalText: body.additionalText,
      settlementId: application.settlement?.id,
      communicationChannels: body.communicationChannels,
      scheduledAt: [body.meetingDate],
    })
  }

  async addDivisionEndingAdvertToApplication(
    applicationId: string,
    body: CreateDivisionEndingDto,
    submittee: PersonDto,
  ): Promise<void> {
    const application = await this.applicationModel.findOneOrThrow({
      where: {
        id: applicationId,
        submittedByNationalId: submittee.kennitala,
        status: ApplicationStatusEnum.SUBMITTED,
        type: {
          [Op.or]: [
            ApplicationTypeEnum.RECALL_BANKRUPTCY,
            ApplicationTypeEnum.RECALL_DECEASED,
          ],
        },
      },
    })

    if (!application.settlement) {
      throw new BadRequestException(
        'Application is missing settlement information',
      )
    }

    const parsed = recallApplicationValidationSchema.parse(application.answers)

    await this.advertService.createAdvert({
      applicationId: application.id,
      caseId: application.caseId,
      typeId: TypeIdEnum.DIVISION_ENDING,
      categoryId: CategoryDefaultIdEnum.DIVISION_ENDINGS,
      templateType: AdvertTemplateType.DIVISION_ENDING,
      createdBy: submittee.nafn,
      createdByNationalId: submittee.kennitala,
      signatureName: body.signature?.name,
      signatureDate: body.signature?.date,
      signatureLocation: body.signature?.location,
      signatureOnBehalfOf: body.signature?.onBehalfOf,
      title: `Skiptalok - ${application.settlement.name}`,
      additionalText: body.additionalText,
      settlementId: application.settlement.id,
      judgementDate: parsed.answers.courtAndJudgmentFields.judgmentDate,
      communicationChannels: body.communicationChannels,
      scheduledAt: [body.meetingDate],
    })

    await application.update({ status: ApplicationStatusEnum.FINISHED })
  }

  async updateApplication(
    applicationId: string,
    body: UpdateApplicationDto,
    user: DMRUser,
  ): Promise<ApplicationDetailedDto> {
    const application = await this.applicationModel.findOneOrThrow({
      where: { id: applicationId, submittedByNationalId: user.nationalId },
    })

    const parsed = updateApplicationSchema.parse({
      type: application.type,
      answers: body.answers,
    })

    switch (parsed.type) {
      case ApplicationTypeEnum.COMMON: {
        const parsedAnswers = commonApplicationSchema.parse(parsed.answers)
        await application.update({ answers: parsedAnswers })
        break
      }
      case ApplicationTypeEnum.RECALL_DECEASED:
      case ApplicationTypeEnum.RECALL_BANKRUPTCY: {
        const parsedAnswers = recallApplicationSchema.parse(parsed.answers)
        await application.update({ answers: parsedAnswers })
        break
      }
      default:
        this.logger.warn(
          `Attempted to update application with unknown type: ${application.type}`,
        )
        throw new BadRequestException()
    }

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
    type: ApplicationTypeEnum,
    user: DMRUser,
  ): Promise<ApplicationDto> {
    // TODO accept update application dto? to enables us to copy applications

    const caseData = await this.caseModel.create(
      {
        involvedPartyNationalId: user.nationalId,
        application: {
          type: type,
          submittedByNationalId: user.nationalId,
          answers: {},
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
    body: IslandIsSubmitApplicationDto,
    submittee: PersonDto,
  ): Promise<void> {
    const newCase = await this.caseModel.create(
      { involvedPartyNationalId: submittee.kennitala },
      { returning: ['id'] },
    )

    const category = await this.categoryModel.findByPkOrThrow(body.categoryId)

    await this.advertService.createAdvert({
      caseId: newCase.id,
      typeId: body.typeId,
      categoryId: body.categoryId,
      islandIsApplicationId: body.islandIsApplicationId,
      createdBy: submittee.nafn,
      createdByNationalId: submittee.kennitala,
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

    switch (application.type) {
      case ApplicationTypeEnum.COMMON:
        await this.submitCommonApplication(application, submittee)
        break
      case ApplicationTypeEnum.RECALL_BANKRUPTCY:
      case ApplicationTypeEnum.RECALL_DECEASED:
        await this.submitRecallApplication(application, submittee)
        break
      default:
        this.logger.warn(
          `Attempted to submit application with unknown type: ${application.type}`,
        )
        throw new BadRequestException()
    }
  }
}

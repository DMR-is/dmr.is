import deepmerge from 'deepmerge'
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
import { INationalRegistryService } from '@dmr.is/clients/national-registry'
import {
  ApplicationTypeEnum,
  commonApplicationAnswersRefined,
  communicationChannelSchema,
  recallBankruptcyAnswersRefined,
  recallDeceasedAnswersRefined,
  updateApplicationInput,
} from '@dmr.is/legal-gazette/schemas'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { PagingQuery } from '@dmr.is/shared/dto'
import { generatePaging, getLimitAndOffset } from '@dmr.is/utils'

import {
  RECALL_BANKRUPTCY_ADVERT_TYPE_ID,
  RECALL_CATEGORY_ID,
  RECALL_DECEASED_ADVERT_TYPE_ID,
} from '../../core/constants'
import {
  AdvertTemplateType,
  CreateAdvertInternalDto,
} from '../../models/advert.model'
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
    submittee: DMRUser,
  ) {
    const parsed = commonApplicationAnswersRefined.parse(application.answers)

    await this.advertService.createAdvert({
      caseId: application.caseId,
      applicationId: application.id,
      createdBy: submittee.name,
      createdByNationalId: submittee.nationalId,
      typeId: parsed.fields.type.id,
      categoryId: parsed.fields.category.id,
      caption: parsed.fields.caption,
      additionalText: parsed.additionalText,
      signature: {
        ...parsed.signature,
        date: parsed.signature?.date
          ? new Date(parsed.signature.date)
          : undefined,
      },
      content: parsed.fields.html,
      title: parsed.fields.caption,
      communicationChannels: parsed.communicationChannels,
      scheduledAt: parsed.publishingDates,
    })

    await application.update({ status: ApplicationStatusEnum.FINISHED })
  }

  private async submitRecallApplication(
    application: ApplicationModel,
    user: DMRUser,
  ) {
    let data

    let createObj: CreateAdvertInternalDto = {} as CreateAdvertInternalDto

    switch (application.applicationType) {
      case ApplicationTypeEnum.RECALL_BANKRUPTCY: {
        const check = recallBankruptcyAnswersRefined.safeParse(
          application.answers,
        )

        if (!check.success) {
          this.logger.error('Failed to parse application answers', {
            context: 'ApplicationService',
            applicationId: application.id,
            error: z.treeifyError(check.error),
          })
          throw new BadRequestException('Invalid application data')
        }

        data = check.data
        Object.assign(createObj, {
          settlement: {
            deadline: data.fields.settlementFields.deadlineDate,
          },
        })
        break
      }
      case ApplicationTypeEnum.RECALL_DECEASED: {
        const check = recallDeceasedAnswersRefined.safeParse(
          application.answers,
        )

        if (!check.success) {
          this.logger.error('Failed to parse application answers', {
            context: 'ApplicationService',
            applicationId: application.id,
            error: z.treeifyError(check.error),
          })
          throw new BadRequestException('Invalid application data')
        }

        data = check.data
        Object.assign(createObj, {
          settlement: {
            dateOfDeath: data.fields.settlementFields.dateOfDeath,
            type: data.fields.settlementFields.type,
          },
        })
        break
      }
      default:
        this.logger.warn(
          `Attempted to submit recall application with unknown type: ${application.applicationType}`,
        )
        throw new BadRequestException()
    }

    const title =
      application.applicationType === ApplicationTypeEnum.RECALL_BANKRUPTCY
        ? `Innköllun þrotabús - ${data.fields.settlementFields.name}`
        : `Innköllun dánarbús - ${data.fields.settlementFields.name}`

    createObj = {
      applicationId: application.id,
      templateType:
        application.applicationType === ApplicationTypeEnum.RECALL_BANKRUPTCY
          ? AdvertTemplateType.RECALL_BANKRUPTCY
          : AdvertTemplateType.RECALL_DECEASED,
      caseId: application.caseId,
      typeId:
        application.applicationType === ApplicationTypeEnum.RECALL_BANKRUPTCY
          ? RECALL_BANKRUPTCY_ADVERT_TYPE_ID
          : RECALL_DECEASED_ADVERT_TYPE_ID,
      categoryId: RECALL_CATEGORY_ID,
      createdBy: user.name,
      createdByNationalId: user.nationalId,
      signature: {
        ...data.signature,
        date: data.signature?.date ? new Date(data.signature.date) : undefined,
      },
      title: title,
      divisionMeetingDate: data.fields.divisionMeetingFields?.meetingDate,
      divisionMeetingLocation:
        data.fields.divisionMeetingFields?.meetingLocation,
      judgementDate: data.fields.courtAndJudgmentFields?.judgmentDate,
      courtDistrictId: data.fields.courtAndJudgmentFields?.courtDistrictId,
      communicationChannels: data.communicationChannels,
      scheduledAt: data.publishingDates,
      settlement: {
        ...data.fields.settlementFields,
        ...createObj.settlement,
      },
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

    await this.advertService.createAdvert({
      applicationId: application.id,
      templateType:
        application.applicationType === ApplicationTypeEnum.RECALL_BANKRUPTCY
          ? AdvertTemplateType.DIVISION_MEETING_BANKRUPTCY
          : AdvertTemplateType.DIVISION_MEETING_DECEASED,
      caseId: application.caseId,
      categoryId: CategoryDefaultIdEnum.DIVISION_MEETINGS,
      createdBy: user.name,
      createdByNationalId: user.nationalId,
      signature: {
        ...body.signature,
        date: body.signature?.date ? new Date(body.signature.date) : undefined,
      },
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

    if (!application.settlement) {
      throw new BadRequestException(
        'Application is missing settlement information',
      )
    }

    let parsedAnswers
    try {
      if (
        application.applicationType === ApplicationTypeEnum.RECALL_BANKRUPTCY
      ) {
        parsedAnswers = recallBankruptcyAnswersRefined.parse(
          application.answers,
        )
      } else if (
        application.applicationType === ApplicationTypeEnum.RECALL_DECEASED
      ) {
        parsedAnswers = recallDeceasedAnswersRefined.parse(application.answers)
      } else {
        throw new BadRequestException('Invalid application type')
      }
    } catch (error) {
      this.logger.error('Failed to parse application answers', {
        context: 'ApplicationService',
        applicationId: application.id,
        error,
      })
      throw new BadRequestException('Invalid application data')
    }

    await this.advertService.createAdvert({
      applicationId: application.id,
      caseId: application.caseId,
      typeId: TypeIdEnum.DIVISION_ENDING,
      categoryId: CategoryDefaultIdEnum.DIVISION_ENDINGS,
      templateType: AdvertTemplateType.DIVISION_ENDING,
      createdBy: user.name,
      createdByNationalId: user.nationalId,
      signature: {
        ...body.signature,
        date: body.signature?.date ? new Date(body.signature.date) : undefined,
      },
      title: `Skiptalok - ${application.settlement.name}`,
      additionalText: body.additionalText,
      settlementId: application.settlement.id,
      judgementDate: parsedAnswers.fields.courtAndJudgmentFields.judgmentDate,
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

    const parsedData = updateApplicationInput.parse({
      type: application.applicationType,
      answers: body.answers,
    })

    const currentAnswers =
      (application.answers as Record<string, unknown>) || {}
    const incomingAnswers =
      (parsedData.answers as Record<string, unknown>) || {}

    const mergedAnswers = deepmerge(currentAnswers, incomingAnswers, {
      customMerge: (key) => {
        if (key === 'companies') {
          return (_current, incoming) => incoming
        }

        if (key === 'publishingDates') {
          return (_current, incoming) => incoming
        }

        if (key === 'communicationChannels') {
          return (current, incoming) => {
            const merged = [...current]

            incoming.forEach(
              (sourceChannel: z.infer<typeof communicationChannelSchema>) => {
                const index = merged.findIndex(
                  (t) => t.email === sourceChannel.email,
                )
                if (index > -1) {
                  merged[index] = sourceChannel
                } else {
                  merged.push(sourceChannel)
                }
              },
            )

            return merged
          }
        }
      },
    })

    const validatedMerged = updateApplicationInput.parse({
      type: application.applicationType,
      answers: mergedAnswers,
    })

    await application.update({
      answers: validatedMerged.answers,
    })

    await application.reload()

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
          applicationType: type,
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
      createdBy: user.name,
      createdByNationalId: user.nationalId,
      signature: {
        name: body.signature.name,
        date: body.signature.date,
        location: body.signature.location,
        onBehalfOf: body.signature.onBehalfOf,
      },
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

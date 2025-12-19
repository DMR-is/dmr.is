import addDays from 'date-fns/addDays'
import { Op } from 'sequelize'
import z from 'zod'

import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import {
  ApplicationTypeEnum,
  recallBankruptcyAnswersRefined,
  recallDeceasedAnswersRefined,
} from '@dmr.is/legal-gazette/schemas'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { addBusinessDays, getNextValidPublishingDate } from '@dmr.is/utils/date'

import {
  RECALL_BANKRUPTCY_ADVERT_TYPE_ID,
  RECALL_CATEGORY_ID,
  RECALL_DECEASED_ADVERT_TYPE_ID,
} from '../../../core/constants'
import {
  AdvertModel,
  AdvertTemplateType,
  CreateAdvertInternalDto,
} from '../../../models/advert.model'
import { AdvertPublicationModel } from '../../../models/advert-publication.model'
import {
  ApplicationModel,
  ApplicationStatusEnum,
  CreateDivisionEndingDto,
  CreateDivisionMeetingDto,
  GetMinDateResponseDto,
} from '../../../models/application.model'
import { CategoryDefaultIdEnum } from '../../../models/category.model'
import { TypeIdEnum } from '../../../models/type.model'
import { IAdvertService } from '../../advert/advert.service.interface'
import { IRecallApplicationService } from './recall-application.service.interface'

@Injectable()
export class RecallApplicationService implements IRecallApplicationService {
  constructor(
    @Inject(LOGGER_PROVIDER) private logger: Logger,
    @Inject(IAdvertService) private advertService: IAdvertService,
    @InjectModel(AdvertModel) private advertModel: typeof AdvertModel,
    @InjectModel(ApplicationModel)
    private applicationModel: typeof ApplicationModel,
  ) {}
  async addDivisionMeeting(
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

  async addDivisionEnding(
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
  async getMinDateForDivisionMeeting(
    applicationId: string,
  ): Promise<GetMinDateResponseDto> {
    // first we check if there has already been advertised skiptafundur before
    // if so then the minDate is one week later than the previous skiptafundur date
    // if not we get the first publication date from the recall advert
    // for first recall adverts, the division meeting can be included in the same advert
    // so we need to check if the recall advert contains a division meeting date
    // if so then the minDate is one week later than that date
    // if not then the minDate is 9 weeks later than the first publication date of the recall advert

    const divisionMeeting = await this.advertModel.findOne({
      attributes: ['id', 'createdAt'],
      where: {
        applicationId: applicationId,
        typeId: TypeIdEnum.DIVISION_MEETING,
      },
      order: [['createdAt', 'ASC']],
      include: [
        {
          required: true,
          as: 'publications',
          model: AdvertPublicationModel,
          attributes: ['id', 'scheduledAt', 'publishedAt'],
          limit: 1,
          order: [
            ['publishedAt', 'DESC NULLS FIRST'],
            ['scheduledAt', 'DESC'],
          ],
        },
      ],
    })

    if (divisionMeeting && divisionMeeting.publications.length > 0) {
      const meeting = divisionMeeting.publications[0]
      const previousMeetingDate = meeting.publishedAt
        ? new Date(meeting.publishedAt)
        : new Date(meeting.scheduledAt)

      const nextMinMeetingDate = addBusinessDays(
        previousMeetingDate,
        5,
      ).toISOString()
      this.logger.debug(
        `Found previous division meeting advert, setting next min meeting date to`,
        {
          context: 'ApplicationService',
          message: nextMinMeetingDate,
          applicationId: applicationId,
          advertId: divisionMeeting.id,
          previousMeetingDate: previousMeetingDate.toISOString(),
          nextMinMeetingDate: nextMinMeetingDate,
        },
      )

      return { minDate: nextMinMeetingDate }
    }

    this.logger.debug(`No division meeting advert found for application`, {
      context: 'ApplicationService',
      applicationId: applicationId,
    })

    const firstRecallAdvert = await this.advertModel.findOne({
      attributes: ['id', 'divisionMeetingDate', 'createdAt'],
      where: {
        applicationId: applicationId,
        typeId: {
          [Op.in]: [
            RECALL_BANKRUPTCY_ADVERT_TYPE_ID,
            RECALL_DECEASED_ADVERT_TYPE_ID,
          ],
        },
      },
      order: [['createdAt', 'ASC NULLS LAST']],
      include: [
        {
          required: true,
          as: 'publications',
          model: AdvertPublicationModel,
          attributes: ['id', 'scheduledAt', 'publishedAt'],
          limit: 1,
          order: [
            ['publishedAt', 'ASC NULLS LAST'],
            ['scheduledAt', 'ASC'],
          ],
        },
      ],
    })

    if (!firstRecallAdvert) {
      this.logger.warn(`No recall adverts found for application`, {
        context: 'ApplicationService',
        applicationId: applicationId,
      })

      // if there is no recall advert found, we cannot determine a minDate
      return { minDate: getNextValidPublishingDate().toISOString() }
    }

    if (firstRecallAdvert.publications.length === 0) {
      this.logger.warn(
        `No publications found for first recall advert of application`,
        {
          context: 'ApplicationService',
          applicationId: applicationId,
          advertId: firstRecallAdvert.id,
        },
      )

      return { minDate: getNextValidPublishingDate().toISOString() }
    }

    const firstPublication = firstRecallAdvert.publications[0]

    if (firstRecallAdvert.divisionMeetingDate) {
      const previousMeetingDate = new Date(
        firstRecallAdvert.divisionMeetingDate,
      )

      const nextMinMeetingDate = addBusinessDays(
        previousMeetingDate,
        5,
      ).toISOString()

      this.logger.debug(
        `Found division meeting date in first recall advert, setting min date based on that date`,
        {
          context: 'ApplicationService',
          applicationId: applicationId,
          advertId: firstRecallAdvert.id,
          previousMeetingDate: previousMeetingDate,
          nextMinMeetingDate: nextMinMeetingDate,
        },
      )

      return { minDate: nextMinMeetingDate }
    }

    const previousMeetingDate = firstPublication.publishedAt
      ? new Date(firstPublication.publishedAt)
      : new Date(firstPublication.scheduledAt)

    // Adding 63 days (9 weeks) to the minDate
    const nextMeetingDate = getNextValidPublishingDate(
      addDays(previousMeetingDate, 63),
    ).toISOString()

    this.logger.debug(
      `No division meeting date found in first recall advert, setting min date based on first publication date`,
      {
        context: 'ApplicationService',
        applicationId: applicationId,
        advertId: firstRecallAdvert.id,
        previousMeetingDate: previousMeetingDate.toISOString(),
        nextMeetingDate: nextMeetingDate,
      },
    )

    return { minDate: previousMeetingDate.toISOString() }
  }
  async submitRecallApplication(
    applicationId: string,
    user: DMRUser,
  ): Promise<void> {
    const application = await this.applicationModel.findOneOrThrow({
      where: {
        id: applicationId,
        submittedByNationalId: user.nationalId,
        status: ApplicationStatusEnum.DRAFT,
        applicationType: {
          [Op.or]: [
            ApplicationTypeEnum.RECALL_BANKRUPTCY,
            ApplicationTypeEnum.RECALL_DECEASED,
          ],
        },
      },
      include: [AdvertModel],
    })

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
}

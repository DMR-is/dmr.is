import addDays from 'date-fns/addDays'
import { Op } from 'sequelize'
import * as z from 'zod'

import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import {
  ApplicationTypeEnum,
  recallBankruptcyAnswersRefined,
  recallDeceasedAnswersRefined,
} from '@dmr.is/legal-gazette/schemas'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { addBusinessDays, getNextValidPublishingDate } from '@dmr.is/utils/server/dateUtils'

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

const LOGGING_CONTEXT = 'RecallApplicationService'
@Injectable()
export class RecallApplicationService implements IRecallApplicationService {
  constructor(
    @Inject(LOGGER_PROVIDER) private logger: Logger,
    @Inject(IAdvertService) private advertService: IAdvertService,
    @InjectModel(AdvertModel) private advertModel: typeof AdvertModel,
    @InjectModel(ApplicationModel)
    private applicationModel: typeof ApplicationModel,
  ) {}

  async getMinDateForDivisionEnding(
    applicationId: string,
  ): Promise<GetMinDateResponseDto> {
    // The min date for division ending can be the day after latest division meeting
    // if no division meeting exists then it should be 2 months and 1 week after the first recall advert publication date

    const divisionMeeting = await this.advertModel.findOne({
      attributes: ['id', 'createdAt'],
      where: {
        applicationId: applicationId,
      },
      include: [
        {
          model: AdvertPublicationModel,
          as: 'publications',
          attributes: ['id', 'scheduledAt', 'publishedAt'],
          required: true,
          order: [
            ['publishedAt', 'DESC NULLS FIRST'],
            ['scheduledAt', 'DESC'],
          ],
          limit: 1,
        },
      ],
    })

    if (divisionMeeting && divisionMeeting.publications.length > 0) {
      const meeting = divisionMeeting.publications[0]

      const previousMeetingDate = meeting.publishedAt
        ? new Date(meeting.publishedAt)
        : new Date(meeting.scheduledAt)

      const nextMeetingDate = addBusinessDays(
        previousMeetingDate,
        1,
      ).toISOString()

      this.logger.debug(
        `Found previous division meeting advert, setting next min meeting date to`,
        {
          context: LOGGING_CONTEXT,
          message: nextMeetingDate,
          applicationId: applicationId,
          advertId: divisionMeeting.id,
          previousMeetingDate: previousMeetingDate.toISOString(),
          nextMinMeetingDate: nextMeetingDate,
        },
      )

      return { minDate: nextMeetingDate }
    }

    this.logger.debug(`No division meeting advert found for application`, {
      context: LOGGING_CONTEXT,
      applicationId: applicationId,
    })

    const firstRecallAdvert = await this.advertModel.findOne({
      attributes: ['id', 'createdAt', 'divisionMeetingDate'],
      where: {
        applicationId: applicationId,
        typeId: {
          [Op.in]: [
            RECALL_BANKRUPTCY_ADVERT_TYPE_ID,
            RECALL_DECEASED_ADVERT_TYPE_ID,
          ],
        },
      },
      order: [['createdAt', 'ASC']],
      include: [
        {
          required: true,
          as: 'publications',
          model: AdvertPublicationModel,
          attributes: ['id', 'scheduledAt', 'publishedAt'],
          limit: 1,
        },
      ],
    })

    if (!firstRecallAdvert || firstRecallAdvert.publications.length === 0) {
      this.logger.warn(`No recall adverts found for application`, {
        context: LOGGING_CONTEXT,
        applicationId: applicationId,
      })

      return { minDate: getNextValidPublishingDate().toISOString() }
    }

    if (firstRecallAdvert.divisionMeetingDate) {
      const divisionMeetingDate = new Date(
        firstRecallAdvert.divisionMeetingDate,
      )

      const nextMinDate = addBusinessDays(divisionMeetingDate, 1).toISOString()
      this.logger.debug(
        `Found division meeting date on first recall advert, setting next min meeting date to`,
        {
          context: LOGGING_CONTEXT,
          message: nextMinDate,
          applicationId: applicationId,
          advertId: firstRecallAdvert.id,
          divisionMeetingDate: divisionMeetingDate.toISOString(),
          nextMinMeetingDate: nextMinDate,
        },
      )
      return { minDate: nextMinDate }
    }

    const firstPublication = firstRecallAdvert.publications[0]
    const publicationDate = firstPublication.publishedAt
      ? new Date(firstPublication.publishedAt)
      : new Date(firstPublication.scheduledAt)

    const nextMinDate = getNextValidPublishingDate(
      addDays(publicationDate, 63),
    ).toISOString()

    this.logger.debug(
      `No division meeting date found on first recall advert, setting next min meeting date to`,
      {
        context: LOGGING_CONTEXT,
        message: nextMinDate,
        applicationId: applicationId,
        advertId: firstRecallAdvert.id,
        publicationDate: publicationDate.toISOString(),
        nextMinMeetingDate: nextMinDate,
      },
    )

    return { minDate: nextMinDate }
  }
  async addDivisionMeeting(
    applicationId: string,
    body: CreateDivisionMeetingDto,
    user: DMRUser,
  ): Promise<void> {
    const application = await this.applicationModel.findOneOrThrow({
      where: {
        id: applicationId,
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
      communicationChannels: application.answers.communicationChannels,
      scheduledAt: [body.meetingDate],
    })
  }

  async addDivisionEnding(
    applicationId: string,
    body: CreateDivisionEndingDto,
    user: DMRUser,
  ): Promise<void> {
    this.logger.info('Adding division ending advert for application', {
      context: LOGGING_CONTEXT,
      applicationId: applicationId,
    })

    const { judgementDate } = await this.advertModel.findOneOrThrow({
      attributes: ['id', 'judgementDate'],
      where: {
        applicationId: applicationId,
        typeId: {
          [Op.in]: [
            RECALL_BANKRUPTCY_ADVERT_TYPE_ID,
            RECALL_DECEASED_ADVERT_TYPE_ID,
          ],
        },
      },
    })

    if (!judgementDate) {
      this.logger.error(
        `Cannot create division ending advert without judgement date set on recall advert`,
        {
          context: LOGGING_CONTEXT,
          applicationId: applicationId,
        },
      )
      throw new BadRequestException('Judgement date not set on recall advert')
    }

    const application = await this.applicationModel.findOne({
      where: {
        id: applicationId,
        status: ApplicationStatusEnum.SUBMITTED,
        applicationType: {
          [Op.or]: [
            ApplicationTypeEnum.RECALL_BANKRUPTCY,
            ApplicationTypeEnum.RECALL_DECEASED,
          ],
        },
      },
    })

    if (!application) {
      this.logger.error(
        `Cannot create division ending advert for application that is not in SUBMITTED status`,
        {
          context: LOGGING_CONTEXT,
          applicationId: applicationId,
        },
      )
      throw new BadRequestException('Application is not in SUBMITTED status')
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
      content: body.content,
      title: `Skiptalok - ${application.settlement?.name}`,
      additionalText: body.additionalText,
      settlementId: application.settlement?.id,
      judgementDate: judgementDate.toISOString(),
      communicationChannels: application.answers.communicationChannels,
      scheduledAt: [body.scheduledAt.toISOString()],
    })

    await application.settlement?.update({
      declaredClaims: body.declaredClaims,
      endingDate: body.endingDate,
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
          context: LOGGING_CONTEXT,
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
      context: LOGGING_CONTEXT,
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
        context: LOGGING_CONTEXT,
        applicationId: applicationId,
      })

      // if there is no recall advert found, we cannot determine a minDate
      return { minDate: getNextValidPublishingDate().toISOString() }
    }

    if (firstRecallAdvert.publications.length === 0) {
      this.logger.warn(
        `No publications found for first recall advert of application`,
        {
          context: LOGGING_CONTEXT,
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
          context: LOGGING_CONTEXT,
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
        context: LOGGING_CONTEXT,
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
            context: LOGGING_CONTEXT,
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
          {
            context: LOGGING_CONTEXT,
            applicationId: application.id,
          },
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
      additionalText: data.additionalText,
      divisionMeetingDate: data.fields.divisionMeetingFields?.meetingDate,
      divisionMeetingLocation:
        data.fields.divisionMeetingFields?.meetingLocation,
      judgementDate: data.fields.courtAndJudgmentFields?.judgmentDate,
      courtDistrictId: data.fields.courtAndJudgmentFields?.courtDistrict.id,
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

import addDays from 'date-fns/addDays'
import { Op } from 'sequelize'
import * as z from 'zod'

import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'
import {
  ApplicationTypeEnum,
  recallBankruptcyAnswersRefined,
  recallDeceasedAnswersRefined,
  SettlementType,
} from '@dmr.is/legal-gazette-schemas'
import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { addBusinessDays, getNextValidPublishingDate } from '@dmr.is/utils-server/dateUtils'

import {
  RECALL_BANKRUPTCY_ADVERT_TYPE_ID,
  RECALL_CATEGORY_ID,
  RECALL_DECEASED_ADVERT_TYPE_ID,
} from '../../../core/constants'
import {
  AdvertModel,
  AdvertTemplateType,
} from '../../../models/advert.model'
import { AdvertPublicationModel } from '../../../models/advert-publication.model'
import {
  ApplicationModel,
  ApplicationStatusEnum,
} from '../../../models/application.model'
import { CategoryDefaultIdEnum } from '../../../models/category.model'
import { TypeIdEnum } from '../../../models/type.model'
import { IAdvertService } from '../../advert/advert.service.interface'
import { CreateAdvertInternalDto } from '../../advert/dto/advert.dto'
import { CreateSettlementDto } from '../../settlement/dto/settlement.dto'
import {
  CreateDivisionEndingDto,
  CreateDivisionMeetingDto,
  GetMinDateResponseDto,
} from '../dto/application-extra.dto'
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

      const nextMeetingDate = addBusinessDays(previousMeetingDate, 1)

      this.logger.debug(
        `Found previous division meeting advert, setting next min meeting date to`,
        {
          context: LOGGING_CONTEXT,
          message: nextMeetingDate.toISOString(),
          applicationId: applicationId,
          advertId: divisionMeeting.id,
          previousMeetingDate: previousMeetingDate.toISOString(),
          nextMinMeetingDate: nextMeetingDate.toISOString(),
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

      return { minDate: getNextValidPublishingDate() }
    }

    if (firstRecallAdvert.divisionMeetingDate) {
      const divisionMeetingDate = new Date(
        firstRecallAdvert.divisionMeetingDate,
      )

      const nextMinDate = addBusinessDays(divisionMeetingDate, 1)
      this.logger.debug(
        `Found division meeting date on first recall advert, setting next min meeting date to`,
        {
          context: LOGGING_CONTEXT,
          message: nextMinDate.toISOString(),
          applicationId: applicationId,
          advertId: firstRecallAdvert.id,
          divisionMeetingDate: divisionMeetingDate.toISOString(),
          nextMinMeetingDate: nextMinDate.toISOString(),
        },
      )
      return { minDate: nextMinDate }
    }

    const firstPublication = firstRecallAdvert.publications[0]
    const publicationDate = firstPublication.publishedAt
      ? new Date(firstPublication.publishedAt)
      : new Date(firstPublication.scheduledAt)

    const nextMinDate = getNextValidPublishingDate(addDays(publicationDate, 63))

    this.logger.debug(
      `No division meeting date found on first recall advert, setting next min meeting date to`,
      {
        context: LOGGING_CONTEXT,
        message: nextMinDate.toISOString(),
        applicationId: applicationId,
        advertId: firstRecallAdvert.id,
        publicationDate: publicationDate.toISOString(),
        nextMinMeetingDate: nextMinDate.toISOString(),
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
      judgementDate: judgementDate,
      communicationChannels: application.answers.communicationChannels,
      scheduledAt: [body.scheduledAt],
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

      const nextMinMeetingDate = addBusinessDays(previousMeetingDate, 5)
      this.logger.debug(
        `Found previous division meeting advert, setting next min meeting date to`,
        {
          context: LOGGING_CONTEXT,
          message: nextMinMeetingDate.toISOString(),
          applicationId: applicationId,
          advertId: divisionMeeting.id,
          previousMeetingDate: previousMeetingDate.toISOString(),
          nextMinMeetingDate: nextMinMeetingDate.toISOString(),
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
      return { minDate: getNextValidPublishingDate() }
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

      return { minDate: getNextValidPublishingDate() }
    }

    const firstPublication = firstRecallAdvert.publications[0]

    if (firstRecallAdvert.divisionMeetingDate) {
      const previousMeetingDate = new Date(
        firstRecallAdvert.divisionMeetingDate,
      )

      const nextMinMeetingDate = addBusinessDays(previousMeetingDate, 5)

      this.logger.debug(
        `Found division meeting date in first recall advert, setting min date based on that date`,
        {
          context: LOGGING_CONTEXT,
          applicationId: applicationId,
          advertId: firstRecallAdvert.id,
          previousMeetingDate: previousMeetingDate,
          nextMinMeetingDate: nextMinMeetingDate.toISOString(),
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
    )

    this.logger.debug(
      `No division meeting date found in first recall advert, setting min date based on first publication date`,
      {
        context: LOGGING_CONTEXT,
        applicationId: applicationId,
        advertId: firstRecallAdvert.id,
        previousMeetingDate: previousMeetingDate.toISOString(),
        nextMeetingDate: nextMeetingDate.toISOString(),
      },
    )

    return { minDate: nextMeetingDate }
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

    let settlementOverrides: Partial<CreateSettlementDto> = {}

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
        settlementOverrides = {
          deadline: data.fields.settlementFields.deadlineDate
            ? new Date(data.fields.settlementFields.deadlineDate)
            : undefined,
        }
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
        settlementOverrides = {
          dateOfDeath: data.fields.settlementFields.dateOfDeath
            ? new Date(data.fields.settlementFields.dateOfDeath)
            : undefined,
          settlementType: data.fields.settlementFields.type as SettlementType,
        }
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

    const createObj: CreateAdvertInternalDto = {
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
      divisionMeetingDate: data.fields.divisionMeetingFields?.meetingDate
        ? new Date(data.fields.divisionMeetingFields.meetingDate)
        : undefined,
      divisionMeetingLocation:
        data.fields.divisionMeetingFields?.meetingLocation,
      judgementDate: data.fields.courtAndJudgmentFields?.judgmentDate
        ? new Date(data.fields.courtAndJudgmentFields.judgmentDate)
        : undefined,
      courtDistrictId: data.fields.courtAndJudgmentFields?.courtDistrict.id,
      communicationChannels: data.communicationChannels,
      scheduledAt: data.publishingDates.map((publishingDate) =>
        new Date(publishingDate),
      ),
      settlement: {
        liquidatorName: data.fields.settlementFields.liquidatorName,
        liquidatorLocation: data.fields.settlementFields.liquidatorLocation,
        recallRequirementStatementLocation:
          data.fields.settlementFields.recallRequirementStatementLocation,
        recallRequirementStatementType:
          data.fields.settlementFields.recallRequirementStatementType,
        name: data.fields.settlementFields.name,
        nationalId: data.fields.settlementFields.nationalId,
        address: data.fields.settlementFields.address,
        companies:
          'companies' in data.fields.settlementFields
            ? data.fields.settlementFields.companies
            : undefined,
        ...settlementOverrides,
      },
    }

    const advert = await this.advertService.createAdvert(createObj)

    await application.update({
      status: ApplicationStatusEnum.SUBMITTED,
      settlementId: advert.settlement?.id,
    })
  }
}

import { IncludeOptions, Op, Order, WhereOptions } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'

import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { InjectModel } from '@nestjs/sequelize'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import { ApplicationTypeEnum } from '@dmr.is/legal-gazette/schemas'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { PagingQuery } from '@dmr.is/shared/dto'
import { generatePaging, getLimitAndOffset } from '@dmr.is/utils'

import { LegalGazetteEvents } from '../../core/constants'
import {
  CreateCommonAdvertAndApplicationDto,
  CreateRecallBankruptcyAdvertAndApplicationDto,
  CreateRecallDeceasedAdvertAndApplicationDto,
} from '../../core/dto/advert-application.dto'
import {
  AdvertDetailedDto,
  AdvertModel,
  AdvertTemplateType,
  CreateAdvertInternalDto,
  GetAdvertsDto,
  GetAdvertsQueryDto,
  GetAdvertsStatusCounterDto,
  GetExternalAdvertsDto,
  GetMyAdvertsDto,
  MyAdvertListItemDto,
  UpdateAdvertDto,
} from '../../models/advert.model'
import { AdvertPublicationModel } from '../../models/advert-publication.model'
import {
  ApplicationModel,
  ApplicationStatusEnum,
} from '../../models/application.model'
import { CaseModel } from '../../models/case.model'
import {
  CategoryDefaultIdEnum,
  CategoryModel,
} from '../../models/category.model'
import { CommunicationChannelModel } from '../../models/communication-channel.model'
import { SettlementModel } from '../../models/settlement.model'
import { SignatureModel } from '../../models/signature.model'
import { StatusIdEnum, StatusModel } from '../../models/status.model'
import { TypeIdEnum, TypeModel } from '../../models/type.model'
import { UserModel } from '../../models/users.model'
import { ILGNationalRegistryService } from '../national-registry/national-registry.service.interface'
import { ITypeCategoriesService } from '../type-categories/type-categories.service.interface'
import { IAdvertService } from './advert.service.interface'

// Search pattern constants
const NATIONAL_ID_PATTERN = /^\d{6}-?\d{4}$/
const PUBLICATION_NUMBER_PATTERN = /^\d+\/\d{4}$/

const LOGGING_CONTEXT = 'AdvertService'
@Injectable()
export class AdvertService implements IAdvertService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(ILGNationalRegistryService)
    private readonly nationalRegistryService: ILGNationalRegistryService,
    @InjectModel(UserModel) private readonly userModel: typeof UserModel,
    @InjectModel(AdvertModel) private readonly advertModel: typeof AdvertModel,
    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,
    @Inject(ITypeCategoriesService)
    private readonly typeCategoriesService: ITypeCategoriesService,
    @InjectModel(AdvertPublicationModel)
    private readonly advertPublicationModel: typeof AdvertPublicationModel,
    @InjectModel(ApplicationModel)
    private readonly applicationModel: typeof ApplicationModel,
    private readonly eventEmitter: EventEmitter2,
    private readonly sequelize: Sequelize,
  ) {}

  async createAdvertAndCommonApplication(
    body: CreateCommonAdvertAndApplicationDto,
    currentUser: DMRUser,
  ): Promise<void> {
    const applicantName =
      await this.nationalRegistryService.getEntityNameByNationalId(
        body.applicantNationalId,
      )

    const newCase = await this.caseModel.create(
      {
        involvedPartyNationalId: body.applicantNationalId,
      },
      {
        returning: ['id'],
      },
    )

    const application = await this.applicationModel.create(
      {
        caseId: newCase.id,
        applicantNationalId: body.applicantNationalId,
        applicationType: ApplicationTypeEnum.COMMON,
        status: ApplicationStatusEnum.FINISHED,
        submittedByNationalId: currentUser.nationalId,
        answers: {
          additionalText: body.additionalText,
          communicationChannels: body.communicationChannels,
          fields: body.fields,
          prequisitesAccepted: true,
          publishingDates: body.publishingDates,
          signature: {
            ...body.signature,
            date: body.signature.date
              ? body.signature.date.toISOString()
              : null,
          },
        },
      },
      {
        returning: ['id'],
      },
    )

    const advert = await this.createAdvert({
      templateType: AdvertTemplateType.COMMON,
      caseId: newCase.id,
      categoryId: body.fields.categoryId,
      typeId: body.fields.typeId,
      title: body.fields.caption,
      content: body.fields.content,
      createdBy: applicantName,
      createdByNationalId: body.applicantNationalId,
      applicationId: application.id,
      scheduledAt: body.publishingDates,
      additionalText: body.additionalText,
      caption: body.fields.caption,
      communicationChannels: body.communicationChannels,
      signature: body.signature,
      statusId: StatusIdEnum.SUBMITTED,
    })

    this.logger.info('Created advert and common application', {
      caseId: newCase.id,
      applicationId: application.id,
      advertId: advert.id,
      context: 'AdvertService',
    })
  }

  async createAdvertAndRecallBankruptcyApplication(
    body: CreateRecallBankruptcyAdvertAndApplicationDto,
    currentUser: DMRUser,
  ): Promise<void> {
    const applicantName =
      await this.nationalRegistryService.getEntityNameByNationalId(
        body.applicantNationalId,
      )

    const newCase = await this.caseModel.create(
      {
        involvedPartyNationalId: body.applicantNationalId,
      },
      {
        returning: ['id'],
      },
    )

    const application = await this.applicationModel.create(
      {
        caseId: newCase.id,
        applicantNationalId: body.applicantNationalId,
        applicationType: ApplicationTypeEnum.RECALL_BANKRUPTCY,
        status: ApplicationStatusEnum.SUBMITTED,
        submittedByNationalId: currentUser.nationalId,
        answers: {
          additionalText: body.additionalText,
          communicationChannels: body.communicationChannels,
          prequisitesAccepted: true,
          publishingDates: body.publishingDates,
          signature: {
            ...body.signature,
            date: body.signature.date
              ? body.signature.date.toISOString()
              : null,
          },
          fields: {
            courtAndJudgmentFields: {
              courtDistrict: {
                id: body.fields.courtDistrictId,
                slug: '',
                title: '',
              },
              judgmentDate: body.fields.judgmentDate,
            },
            divisionMeetingFields: {
              meetingDate: body.fields.meetingDate,
              meetingLocation: body.fields.meetingLocation,
            },
            settlementFields: {
              nationalId: body.fields.settlementNationalId,
              name: body.fields.settlementName,
              address: body.fields.settlementAddress,
              deadlineDate: body.fields.settlementDate,
              liquidatorLocation: body.fields.liquidatorLocation,
              liquidatorName: body.fields.liquidatorName,
              recallRequirementStatementLocation:
                body.fields.requirementStatementLocation,
              recallRequirementStatementType: body.fields.requirementStatement,
            },
          },
        },
      },
      {
        returning: ['id'],
      },
    )

    const advert = await this.createAdvert({
      templateType: AdvertTemplateType.RECALL_BANKRUPTCY,
      caseId: newCase.id,
      typeId: TypeIdEnum.RECALL_BANKRUPTCY,
      categoryId: CategoryDefaultIdEnum.RECALLS,
      createdBy: applicantName,
      createdByNationalId: body.applicantNationalId,
      applicationId: application.id,
      additionalText: body.additionalText,
      title: `Innköllun þrotabús - ${body.fields.settlementName}`,
      divisionMeetingDate: body.fields.meetingDate,
      divisionMeetingLocation: body.fields.meetingLocation,
      courtDistrictId: body.fields.courtDistrictId,
      judgementDate: body.fields.judgmentDate,
      settlement: {
        nationalId: body.fields.settlementNationalId,
        name: body.fields.settlementName,
        address: body.fields.settlementAddress,
        deadline: body.fields.settlementDate,
        liquidatorLocation: body.fields.liquidatorLocation,
        liquidatorName: body.fields.liquidatorName,
        recallStatementLocation: body.fields.requirementStatementLocation,
        recallStatementType: body.fields.requirementStatement,
      },
      scheduledAt: body.publishingDates,
      communicationChannels: body.communicationChannels,
      signature: body.signature,
    })

    if (advert.settlement?.id) {
      await application.update({ settlementId: advert.settlement.id })
    }

    this.logger.info('Created advert and recall bankruptcy application', {
      caseId: newCase.id,
      applicationId: application.id,
      advertId: advert.id,
      context: 'AdvertService',
    })
  }
  async createAdvertAndRecallDeceasedApplication(
    body: CreateRecallDeceasedAdvertAndApplicationDto,
    currentUser: DMRUser,
  ): Promise<void> {
    const applicantName =
      await this.nationalRegistryService.getEntityNameByNationalId(
        body.applicantNationalId,
      )

    const newCase = await this.caseModel.create(
      {
        involvedPartyNationalId: body.applicantNationalId,
      },
      {
        returning: ['id'],
      },
    )

    const application = await this.applicationModel.create(
      {
        caseId: newCase.id,
        applicantNationalId: body.applicantNationalId,
        applicationType: ApplicationTypeEnum.RECALL_BANKRUPTCY,
        status: ApplicationStatusEnum.SUBMITTED,
        submittedByNationalId: currentUser.nationalId,
        answers: {
          additionalText: body.additionalText,
          communicationChannels: body.communicationChannels,
          prequisitesAccepted: true,
          publishingDates: body.publishingDates,
          signature: {
            ...body.signature,
            date: body.signature.date
              ? body.signature.date.toISOString()
              : null,
          },
          fields: {
            courtAndJudgmentFields: {
              courtDistrict: {
                id: body.fields.courtDistrictId,
                slug: '',
                title: '',
              },
              judgmentDate: body.fields.judgmentDate,
            },
            divisionMeetingFields: {
              meetingDate: body.fields.meetingDate,
              meetingLocation: body.fields.meetingLocation,
            },
            settlementFields: {
              nationalId: body.fields.settlementNationalId,
              name: body.fields.settlementName,
              address: body.fields.settlementAddress,
              deadlineDate: body.fields.settlementDate,
              liquidatorLocation: body.fields.liquidatorLocation,
              liquidatorName: body.fields.liquidatorName,
              recallRequirementStatementLocation:
                body.fields.requirementStatementLocation,
              recallRequirementStatementType: body.fields.requirementStatement,
            },
          },
        },
      },
      {
        returning: ['id'],
      },
    )

    const advert = await this.createAdvert({
      templateType: AdvertTemplateType.RECALL_BANKRUPTCY,
      caseId: newCase.id,
      typeId: TypeIdEnum.RECALL_BANKRUPTCY,
      categoryId: CategoryDefaultIdEnum.RECALLS,
      createdBy: applicantName,
      createdByNationalId: body.applicantNationalId,
      applicationId: application.id,
      additionalText: body.additionalText,
      title: `Innköllun dánarbús - ${body.fields.settlementName}`,
      divisionMeetingDate: body.fields.meetingDate,
      divisionMeetingLocation: body.fields.meetingLocation,
      courtDistrictId: body.fields.courtDistrictId,
      judgementDate: body.fields.judgmentDate,
      settlement: {
        settlementType: body.fields.settlementType,
        nationalId: body.fields.settlementNationalId,
        name: body.fields.settlementName,
        address: body.fields.settlementAddress,
        dateOfDeath: body.fields.settlementDate,
        companies: body.fields.companies,
        liquidatorLocation: body.fields.liquidatorLocation,
        liquidatorName: body.fields.liquidatorName,
        recallStatementLocation: body.fields.requirementStatementLocation,
        recallStatementType: body.fields.requirementStatement,
      },
      scheduledAt: body.publishingDates,
      communicationChannels: body.communicationChannels,
      signature: body.signature,
    })

    if (advert.settlement?.id) {
      await application.update({ settlementId: advert.settlement.id })
    }

    this.logger.info('Created advert and recall bankruptcy application', {
      caseId: newCase.id,
      applicationId: application.id,
      advertId: advert.id,
      context: 'AdvertService',
    })
  }

  async deleteAdvert(advertId: string): Promise<void> {
    const advert = await this.advertModel.findByPkOrThrow(advertId)

    const deletableStatuses = [
      StatusIdEnum.SUBMITTED,
      StatusIdEnum.IN_PROGRESS,
      StatusIdEnum.READY_FOR_PUBLICATION,
    ]

    if (!deletableStatuses.includes(advert.statusId)) {
      this.logger.warn(
        `Advert with id ${advertId} is in status ${advert.statusId} and cannot be deleted`,
      )

      throw new BadRequestException('Advert cannot be deleted')
    }

    this.logger.info('Destroying advert', {
      advertId,
      context: 'AdvertService',
    })
    await this.advertModel.destroy({ where: { id: advertId } })
  }

  async rejectAdvert(advertId: string, currentUser: DMRUser): Promise<void> {
    await this.sequelize.transaction(async (t) => {
      const user = await this.userModel.unscoped().findOneOrThrow({
        attributes: ['id', 'nationalId'],
        where: { nationalId: currentUser.nationalId },
      })
      const advert = await this.advertModel
        .unscoped()
        .findByPkOrThrow(advertId, {
          attributes: ['id', 'statusId', 'assignedUserId'],
        })

      const isEditable = advert.canEdit(user.id)

      if (!isEditable) {
        this.logger.warn(
          `User with id ${user.id} is not allowed to reject advert with id ${advertId}`,
        )

        throw new BadRequestException(
          'User is not allowed to reject this advert',
        )
      }

      await advert.update({ statusId: StatusIdEnum.REJECTED })

      t.afterCommit(() => {
        this.eventEmitter.emit(LegalGazetteEvents.STATUS_CHANGED, {
          advertId,
          actorId: currentUser.nationalId,
          statusId: StatusIdEnum.REJECTED,
        })
      })
    })
  }

  async reactivateAdvert(
    advertId: string,
    currentUser: DMRUser,
  ): Promise<void> {
    await this.sequelize.transaction(async (t) => {
      const user = await this.userModel.unscoped().findOneOrThrow({
        attributes: ['id', 'nationalId'],
        where: { nationalId: currentUser.nationalId },
      })
      const advert = await this.advertModel
        .unscoped()
        .findByPkOrThrow(advertId, {
          attributes: ['id', 'statusId', 'assignedUserId'],
        })

      // Only REJECTED adverts can be reactivated
      if (advert.statusId !== StatusIdEnum.REJECTED) {
        this.logger.warn(
          `Cannot reactivate advert ${advertId} - status is ${advert.statusId}`,
          {
            context: LOGGING_CONTEXT,
          },
        )
        throw new BadRequestException(
          'Only rejected adverts can be reactivated',
        )
      }

      // Check if user is assigned to the advert
      if (advert.assignedUserId !== user.id) {
        this.logger.warn(
          `User with id ${user.id} is not assigned to advert ${advertId}`,
          {
            context: LOGGING_CONTEXT,
          },
        )
        throw new BadRequestException('User is not assigned to this advert')
      }

      await advert.update({ statusId: StatusIdEnum.IN_PROGRESS })

      t.afterCommit(() => {
        this.eventEmitter.emit(LegalGazetteEvents.STATUS_CHANGED, {
          advertId,
          actorId: currentUser.nationalId,
          statusId: StatusIdEnum.IN_PROGRESS,
        })
      })
    })
  }

  async moveAdvertToNextStatus(
    advertId: string,
    currentUser: DMRUser,
  ): Promise<void> {
    await this.sequelize.transaction(async (t) => {
      const moveableStatuses = [
        StatusIdEnum.SUBMITTED,
        StatusIdEnum.IN_PROGRESS,
      ]

      const currentStatusId = await this.advertModel
        .unscoped()
        .findByPkOrThrow(advertId, {
          attributes: ['id', 'statusId'],
        })

      if (!moveableStatuses.includes(currentStatusId.statusId)) {
        this.logger.warn(
          `Advert with id ${advertId} is in status ${currentStatusId.statusId} and cannot be moved to next status`,
          {
            context: LOGGING_CONTEXT,
          },
        )

        throw new BadRequestException('Advert cannot be moved to next status')
      }

      let nextStatusId: StatusIdEnum

      switch (currentStatusId.statusId) {
        case StatusIdEnum.SUBMITTED:
          nextStatusId = StatusIdEnum.IN_PROGRESS
          break
        case StatusIdEnum.IN_PROGRESS:
          nextStatusId = StatusIdEnum.READY_FOR_PUBLICATION
          break
        default:
          throw new BadRequestException(`Advert cannot be moved to next status`)
      }

      await this.advertModel.update(
        { statusId: nextStatusId },
        { where: { id: advertId } },
      )

      t.afterCommit(() => {
        this.eventEmitter.emit(LegalGazetteEvents.STATUS_CHANGED, {
          advertId,
          actorId: currentUser.nationalId,
          statusId: nextStatusId,
        })
      })
    })
  }
  async moveAdvertToPreviousStatus(
    advertId: string,
    currentUser: DMRUser,
  ): Promise<void> {
    await this.sequelize.transaction(async (t) => {
      const moveableStatuses = [
        StatusIdEnum.IN_PROGRESS,
        StatusIdEnum.READY_FOR_PUBLICATION,
      ]

      const currentStatusId = await this.advertModel
        .unscoped()
        .findByPkOrThrow(advertId, {
          attributes: ['id', 'statusId'],
        })

      if (!moveableStatuses.includes(currentStatusId.statusId)) {
        this.logger.warn(
          `Advert with id ${advertId} is in status ${currentStatusId.statusId} and cannot be moved to previous status`,
          {
            context: LOGGING_CONTEXT,
          },
        )

        throw new BadRequestException(
          'Advert cannot be moved to previous status',
        )
      }

      let previousStatusId: StatusIdEnum

      switch (currentStatusId.statusId) {
        case StatusIdEnum.IN_PROGRESS:
          previousStatusId = StatusIdEnum.SUBMITTED
          break
        case StatusIdEnum.READY_FOR_PUBLICATION:
          previousStatusId = StatusIdEnum.IN_PROGRESS
          break
        default:
          throw new BadRequestException(
            `Advert cannot be moved to previous status`,
          )
      }

      await this.advertModel.update(
        { statusId: previousStatusId },
        { where: { id: advertId } },
      )

      t.afterCommit(() => {
        this.eventEmitter.emit(LegalGazetteEvents.STATUS_CHANGED, {
          advertId,
          actorId: currentUser.nationalId,
          statusId: previousStatusId,
        })
      })
    })
  }

  async createAdvert(
    body: CreateAdvertInternalDto,
  ): Promise<AdvertDetailedDto> {
    const include: IncludeOptions[] = []

    if (body.settlement) {
      include.push({
        model: SettlementModel,
        as: 'settlement',
      })
    }

    if (body.signature) {
      include.push({
        model: SignatureModel,
        as: 'signature',
      })
    }

    if (body.communicationChannels) {
      include.push({
        model: CommunicationChannelModel,
        as: 'communicationChannels',
      })
    }
    if (body.scheduledAt.length === 0) {
      this.logger.warn('Tried to create advert without publication dates', {
        body,
        context: LOGGING_CONTEXT,
      })
      throw new BadRequestException(
        'At least one scheduled publication date is required',
      )
    }

    this.logger.info('Creating advert', {
      body,
      context: 'AdvertService',
    })

    const advert = await this.advertModel.scope('detailed').create(
      {
        applicationId: body.applicationId,
        templateType: body.templateType,
        typeId: body.typeId,
        categoryId: body.categoryId,
        caseId: body.caseId,
        title: body.title,
        content: body.content,
        createdBy: body.createdBy,
        caption: body.caption,
        createdByNationalId: body.createdByNationalId,
        statusId: body.statusId,
        courtDistrictId: body.courtDistrictId,
        legacyHtml: body.legacyHtml,
        islandIsApplicationId: body.islandIsApplicationId,
        externalId: body.externalId,
        judgementDate:
          typeof body.judgementDate === 'string'
            ? new Date(body.judgementDate)
            : body.judgementDate,
        signature: body?.signature,
        additionalText: body.additionalText,
        divisionMeetingDate:
          typeof body.divisionMeetingDate === 'string'
            ? new Date(body.divisionMeetingDate)
            : body.divisionMeetingDate,
        divisionMeetingLocation: body.divisionMeetingLocation,
        communicationChannels: body.communicationChannels,
        settlementId: body.settlementId,
        settlement: body.settlement
          ? {
              type: body.settlement.settlementType,
              liquidatorLocation: body.settlement.liquidatorLocation,
              liquidatorName: body.settlement.liquidatorName,
              liquidatorRecallStatementType:
                body.settlement.recallStatementType,
              liquidatorRecallStatementLocation:
                body.settlement.recallStatementLocation,
              address: body.settlement.address,
              dateOfDeath: body.settlement.dateOfDeath
                ? new Date(body.settlement.dateOfDeath)
                : null,
              deadline: body.settlement.deadline
                ? new Date(body.settlement.deadline)
                : null,
              name: body.settlement.name,
              nationalId: body.settlement.nationalId,
              declaredClaims: body.settlement.declaredClaims ?? null,
              companies: body.settlement.companies,
            }
          : undefined,
      },
      {
        include: include,
        returning: true,
      },
    )

    await this.advertPublicationModel.bulkCreate(
      body.scheduledAt.map((scheduledAt, i) => ({
        advertId: advert.id,
        scheduledAt: new Date(scheduledAt),
        versionNumber: i + 1,
      })),
    )

    await advert.reload()

    this.logger.debug('Emitting advert.created event', {
      advertId: advert.id,
      statusId: advert.statusId,
      actorId: advert.createdByNationalId,
    })

    await this.eventEmitter.emitAsync(
      LegalGazetteEvents.CREATE_SUBMIT_COMMENT,
      {
        advertId: advert.id,
        statusId: advert.statusId,
        actorId: advert.createdByNationalId,
        actorName: advert.createdBy,
        external: body.isFromExternalSystem,
      },
    )

    return advert.fromModelToDetailed()
  }

  async assignAdvertToEmployee(
    advertId: string,
    userId: string,
    currentUser: DMRUser,
  ): Promise<void> {
    return this.sequelize.transaction(async (t) => {
      await this.advertModel.update(
        { assignedUserId: userId },
        { where: { id: advertId } },
      )

      t.afterCommit(() => {
        this.eventEmitter.emit(LegalGazetteEvents.USER_ASSIGNED, {
          advertId,
          actorId: currentUser.nationalId,
          receiverId: userId,
        })
      })
    })
  }

  async markAdvertAsWithdrawn(advertId: string): Promise<void> {
    const advert = await this.advertModel.findByPkOrThrow(advertId, {
      attributes: ['id', 'statusId'],
    })

    await advert.update({ statusId: StatusIdEnum.WITHDRAWN })
  }

  async getAdvertsByCaseId(caseId: string): Promise<GetAdvertsDto> {
    const adverts = await this.advertModel.scope('listview').findAll({
      where: { caseId },
    })

    const mapped = adverts.map((advert) => advert.fromModel())

    return {
      adverts: mapped,
      paging: generatePaging(mapped, 1, mapped.length, mapped.length),
    }
  }

  async getAdvertsByExternalId(
    externalId: string,
  ): Promise<GetExternalAdvertsDto> {
    const adverts = await this.advertModel.scope('listview').findAll({
      where: { externalId },
    })

    return {
      adverts: adverts.map((advert) => advert.fromModelToExternal()),
    }
  }

  async updateAdvert(
    id: string,
    body: UpdateAdvertDto,
  ): Promise<AdvertDetailedDto> {
    const advert = await this.advertModel
      .withScope('detailed')
      .findByPkOrThrow(id)

    // Prevent modification of adverts in terminal states
    const nonEditableStatuses = [
      StatusIdEnum.PUBLISHED,
      StatusIdEnum.REJECTED,
      StatusIdEnum.WITHDRAWN,
    ]

    if (nonEditableStatuses.includes(advert.statusId)) {
      throw new BadRequestException('Cannot modify published adverts')
    }

    const category = body.typeId
      ? (await this.typeCategoriesService.findByTypeId(body.typeId)).type
          .categories[0]
      : undefined

    const updated = await advert.update({
      typeId: body.typeId,
      categoryId: category ? category.id : body.categoryId,
      title: body.title,
      content: body.content,
      additionalText: body.additionalText,
      divisionMeetingDate:
        typeof body.divisionMeetingDate === 'string'
          ? new Date(body.divisionMeetingDate)
          : body.divisionMeetingDate,
      divisionMeetingLocation: body.divisionMeetingLocation,
      caption: body.caption,
      courtDistrictId: body.courtDistrictId,
      judgementDate:
        typeof body.judgementDate === 'string'
          ? new Date(body.judgementDate)
          : body.judgementDate,
    })

    return updated.fromModelToDetailed()
  }

  async getAdvertsCount(
    query: GetAdvertsQueryDto,
  ): Promise<GetAdvertsStatusCounterDto> {
    // Build where options with the same filters as getAdverts
    const whereOptions: WhereOptions = {}

    if (query.typeId) {
      Object.assign(whereOptions, { typeId: { [Op.in]: query.typeId } })
    }

    if (query.categoryId) {
      Object.assign(whereOptions, { categoryId: { [Op.in]: query.categoryId } })
    }

    if (query.dateFrom && query.dateTo) {
      Object.assign(whereOptions, {
        createdAt: {
          [Op.between]: [query.dateFrom, query.dateTo],
        },
      })
    }

    if (query.dateFrom && !query.dateTo) {
      Object.assign(whereOptions, {
        createdAt: {
          [Op.gte]: query.dateFrom,
        },
      })
    }

    if (!query.dateFrom && query.dateTo) {
      Object.assign(whereOptions, {
        createdAt: {
          [Op.lte]: query.dateTo,
        },
      })
    }

    if (query.search) {
      const searchTerm = query.search.trim()

      // Check if it looks like a national ID (10 digits, optionally with dash)
      const isNationalIdFormat = NATIONAL_ID_PATTERN.test(searchTerm)

      // Check if it looks like a publication number (e.g., "123/2024")
      const isPublicationNumber = PUBLICATION_NUMBER_PATTERN.test(searchTerm)

      if (isNationalIdFormat) {
        // Exact national ID search (fast with index)
        const cleanedId = searchTerm.replace('-', '')
        Object.assign(whereOptions, {
          createdByNationalId: cleanedId,
        })
      } else if (isPublicationNumber) {
        // Exact publication number search (fast with index)
        Object.assign(whereOptions, {
          publicationNumber: searchTerm,
        })
      } else {
        // Full-text search for content
        const searchWords = searchTerm
          .split(/\s+/)
          .filter((word) => word.length > 0)

        // Build AND conditions for multi-word search
        const searchConditions = searchWords.map((word) => ({
          [Op.or]: [
            { title: { [Op.iLike]: `%${word}%` } },
            { content: { [Op.iLike]: `%${word}%` } },
            { caption: { [Op.iLike]: `%${word}%` } },
            { additionalText: { [Op.iLike]: `%${word}%` } },
            { createdBy: { [Op.iLike]: `%${word}%` } },
          ],
        }))

        Object.assign(whereOptions, {
          [Op.and]: searchConditions,
        })
      }
    }

    // Determine which tab statuses to count based on statusId filter
    const submittedTabStatuses = [
      StatusIdEnum.SUBMITTED,
      StatusIdEnum.IN_PROGRESS,
    ]
    const readyForPublicationTabStatuses = [StatusIdEnum.READY_FOR_PUBLICATION]
    const finishedTabStatuses = [
      StatusIdEnum.PUBLISHED,
      StatusIdEnum.REJECTED,
      StatusIdEnum.WITHDRAWN,
    ]

    let countSubmittedTab = true
    let countReadyForPublicationTab = true
    let countFinishedTab = true

    // If statusId filter is provided, only count relevant tabs
    if (query.statusId && query.statusId.length > 0) {
      const hasSubmittedStatus = query.statusId.some((id) =>
        submittedTabStatuses.includes(id as StatusIdEnum),
      )
      const hasReadyStatus = query.statusId.some((id) =>
        readyForPublicationTabStatuses.includes(id as StatusIdEnum),
      )
      const hasFinishedStatus = query.statusId.some((id) =>
        finishedTabStatuses.includes(id as StatusIdEnum),
      )

      countSubmittedTab = hasSubmittedStatus
      countReadyForPublicationTab = hasReadyStatus
      countFinishedTab = hasFinishedStatus
    }

    // Count for each tab
    const submittedTabCount = countSubmittedTab
      ? await this.advertModel.unscoped().count({
          where: {
            ...whereOptions,
            statusId: {
              [Op.in]: query.statusId?.length
                ? query.statusId.filter((id) =>
                    submittedTabStatuses.includes(id as StatusIdEnum),
                  )
                : submittedTabStatuses,
            },
          },
        })
      : 0

    const readyForPublicationTabCount = countReadyForPublicationTab
      ? await this.advertModel.unscoped().count({
          where: {
            ...whereOptions,
            statusId: {
              [Op.in]: readyForPublicationTabStatuses,
            },
          },
        })
      : 0

    const finishedTabCount = countFinishedTab
      ? await this.advertModel.unscoped().count({
          where: {
            ...whereOptions,
            statusId: {
              [Op.in]: query.statusId?.length
                ? query.statusId.filter((id) =>
                    finishedTabStatuses.includes(id as StatusIdEnum),
                  )
                : finishedTabStatuses,
            },
          },
        })
      : 0

    const dto = {
      submittedTab: {
        count: submittedTabCount,
      },
      readyForPublicationTab: {
        count: readyForPublicationTabCount,
      },
      finishedTab: {
        count: finishedTabCount,
      },
    }

    return dto
  }

  async getAdverts(query: GetAdvertsQueryDto): Promise<GetAdvertsDto> {
    const { limit, offset } = getLimitAndOffset({
      page: query.page,
      pageSize: query.pageSize,
    })

    const whereOptions: WhereOptions = {}

    if (query.typeId) {
      Object.assign(whereOptions, { typeId: { [Op.in]: query.typeId } })
    }

    if (query.categoryId) {
      Object.assign(whereOptions, { categoryId: { [Op.in]: query.categoryId } })
    }

    if (query.statusId) {
      Object.assign(whereOptions, { statusId: { [Op.in]: query.statusId } })
    }

    if (query.dateFrom && query.dateTo) {
      Object.assign(whereOptions, {
        createdAt: {
          [Op.between]: [query.dateFrom, query.dateTo],
        },
      })
    }

    if (query.dateFrom && !query.dateTo) {
      Object.assign(whereOptions, {
        createdAt: {
          [Op.gte]: query.dateFrom,
        },
      })
    }

    if (!query.dateFrom && query.dateTo) {
      Object.assign(whereOptions, {
        createdAt: {
          [Op.lte]: query.dateTo,
        },
      })
    }

    if (query.search) {
      const searchTerm = query.search.trim()

      // Check if it looks like a national ID (10 digits, optionally with dash)
      const isNationalIdFormat = NATIONAL_ID_PATTERN.test(searchTerm)

      // Check if it looks like a publication number (e.g., "123/2024")
      const isPublicationNumber = PUBLICATION_NUMBER_PATTERN.test(searchTerm)

      if (isNationalIdFormat) {
        // Exact national ID search (fast with index)
        const cleanedId = searchTerm.replace('-', '')
        Object.assign(whereOptions, {
          createdByNationalId: cleanedId,
        })
      } else if (isPublicationNumber) {
        // Exact publication number search (fast with index)
        Object.assign(whereOptions, {
          publicationNumber: searchTerm,
        })
      } else {
        // Full-text search for content
        const searchWords = searchTerm
          .split(/\s+/)
          .filter((word) => word.length > 0)

        // Build AND conditions for multi-word search
        const searchConditions = searchWords.map((word) => ({
          [Op.or]: [
            { title: { [Op.iLike]: `%${word}%` } },
            { content: { [Op.iLike]: `%${word}%` } },
            { caption: { [Op.iLike]: `%${word}%` } },
            { additionalText: { [Op.iLike]: `%${word}%` } },
            { createdBy: { [Op.iLike]: `%${word}%` } },
          ],
        }))

        Object.assign(whereOptions, {
          [Op.and]: searchConditions,
        })
      }
    }

    const order: Order = []
    const direction = query.direction || 'desc'

    if (query.sortBy === 'birting') {
      // Sort by next scheduled publication (published_at IS NULL) first,
      // then by latest published publication
      // This ensures upcoming publications are prioritized
      order.push([
        this.sequelize.literal(`
          (
            SELECT COALESCE(
              MIN(CASE WHEN "published_at" IS NULL THEN "scheduled_at" END),
              MAX("published_at")
            )
            FROM "advert_publication" AS "publications"
            WHERE "publications"."advert_id" = "AdvertModel"."id"
          )
        `),
        direction,
      ])
    } else {
      order.push(['createdAt', direction])
    }

    const results = await this.advertModel.scope('listview').findAndCountAll({
      limit,
      offset,
      where: whereOptions,
      order,
    })

    const migrated = results.rows.map((advert) => advert.fromModel())
    const paging = generatePaging(
      migrated,
      query.page,
      query.pageSize,
      results.count,
    )

    return {
      adverts: migrated,
      paging,
    }
  }

  async getAdvertById(
    id: string,
    currentUser: DMRUser,
  ): Promise<AdvertDetailedDto> {
    const [user, advert] = await Promise.all([
      this.userModel.unscoped().findOne({
        attributes: ['id', 'nationalId'],
        where: { nationalId: currentUser.nationalId },
      }),
      this.advertModel.withScope('detailed').findByPkOrThrow(id),
    ])

    return advert.fromModelToDetailed(user?.id)
  }

  async getMyAdverts(
    query: PagingQuery,
    user: DMRUser,
  ): Promise<GetMyAdvertsDto> {
    const { limit, offset } = getLimitAndOffset(query)

    const adverts = await this.advertModel.unscoped().findAndCountAll({
      limit,
      offset,
      where: {
        createdByNationalId: user.nationalId,
      },
      include: [
        { model: TypeModel, attributes: ['id', 'title', 'slug'] },
        { model: CategoryModel, attributes: ['id', 'title', 'slug'] },
        { model: StatusModel, attributes: ['id', 'title', 'slug'] },
        {
          model: AdvertPublicationModel,
          attributes: ['publishedAt', 'versionNumber', 'scheduledAt'],
        },
      ],
      order: [['createdAt', 'DESC']],
    })

    const mapped: MyAdvertListItemDto[] = adverts.rows.map((advert) => ({
      id: advert.id,
      legacyId: advert.legacyId,
      title: advert.title,
      publicationNumber: advert.publicationNumber,
      type: advert.type.fromModel(),
      category: advert.category.fromModel(),
      status: advert.status.fromModel(),
      createdAt: advert.createdAt,
      publishedAt: advert.publications?.[0]?.publishedAt ?? null,
      html: advert.htmlMarkup(),
    }))

    const paging = generatePaging(
      adverts.rows,
      query.page,
      query.pageSize,
      adverts.count,
    )

    return { adverts: mapped, paging }
  }

  async getMyLegacyAdverts(
    query: PagingQuery,
    user: DMRUser,
  ): Promise<GetMyAdvertsDto> {
    const { limit, offset } = getLimitAndOffset(query)

    const adverts = await this.advertModel.unscoped().findAndCountAll({
      limit,
      offset,
      where: {
        createdByNationalId: user.nationalId,
        legacyId: { [Op.ne]: null },
      },
      include: [
        { model: TypeModel, attributes: ['id', 'title', 'slug'] },
        { model: CategoryModel, attributes: ['id', 'title', 'slug'] },
        { model: StatusModel, attributes: ['id', 'title', 'slug'] },
        {
          model: AdvertPublicationModel,
          attributes: ['publishedAt', 'versionNumber', 'scheduledAt'],
        },
      ],
      order: [['createdAt', 'DESC']],
    })

    const mapped: MyAdvertListItemDto[] = adverts.rows.map((advert) => ({
      id: advert.id,
      legacyId: advert.legacyId,
      title: advert.title,
      publicationNumber: advert.publicationNumber,
      type: advert.type.fromModel(),
      category: advert.category.fromModel(),
      status: advert.status.fromModel(),
      createdAt: advert.createdAt,
      publishedAt: advert.publications?.[0]?.publishedAt ?? null,
      html: advert.htmlMarkup(),
    }))

    const paging = generatePaging(
      adverts.rows,
      query.page,
      query.pageSize,
      adverts.count,
    )

    return { adverts: mapped, paging }
  }
}

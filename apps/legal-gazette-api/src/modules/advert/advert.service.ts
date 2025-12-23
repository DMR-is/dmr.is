import { IncludeOptions, Op, Order, WhereOptions } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'

import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { InjectModel } from '@nestjs/sequelize'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { PagingQuery } from '@dmr.is/shared/dto'
import { generatePaging, getLimitAndOffset } from '@dmr.is/utils'

import { LegalGazetteEvents } from '../../core/constants'
import {
  AdvertDetailedDto,
  AdvertModel,
  CreateAdvertInternalDto,
  GetAdvertsDto,
  GetAdvertsQueryDto,
  GetAdvertsStatusCounterDto,
  GetMyAdvertsDto,
  MyAdvertListItemDto,
  UpdateAdvertDto,
} from '../../models/advert.model'
import { AdvertPublicationModel } from '../../models/advert-publication.model'
import { CategoryModel } from '../../models/category.model'
import { CommunicationChannelModel } from '../../models/communication-channel.model'
import { SettlementModel } from '../../models/settlement.model'
import { SignatureModel } from '../../models/signature.model'
import { StatusIdEnum, StatusModel } from '../../models/status.model'
import { TypeModel } from '../../models/type.model'
import { UserModel } from '../../models/users.model'
import { ITypeCategoriesService } from '../type-categories/type-categories.service.interface'
import { IAdvertService } from './advert.service.interface'
@Injectable()
export class AdvertService implements IAdvertService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(UserModel) private readonly userModel: typeof UserModel,
    @InjectModel(AdvertModel) private readonly advertModel: typeof AdvertModel,
    @Inject(ITypeCategoriesService)
    private readonly typeCategoriesService: ITypeCategoriesService,
    @InjectModel(AdvertPublicationModel)
    private readonly advertPublicationModel: typeof AdvertPublicationModel,
    private readonly eventEmitter: EventEmitter2,
    private readonly sequelize: Sequelize,
  ) {}

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

    return await this.sequelize.transaction(async (t) => {
      if (body.scheduledAt.length === 0) {
        this.logger.warn('Tried to create advert without publication dates', {
          body,
          context: 'AdvertService',
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

      t.afterCommit(() => {
        this.logger.debug('Emitting advert.created event', {
          advertId: advert.id,
          statusId: advert.statusId,
          actorId: advert.createdByNationalId,
        })
        this.eventEmitter.emit(LegalGazetteEvents.ADVERT_CREATED, {
          advertId: advert.id,
          statusId: advert.statusId,
          actorId: advert.createdByNationalId,
          actorName: advert.createdBy,
          external: body.isFromExternalSystem,
        })
      })

      await advert.reload()
      return advert.fromModelToDetailed()
    })
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

  async updateAdvert(
    id: string,
    body: UpdateAdvertDto,
  ): Promise<AdvertDetailedDto> {
    const advert = await this.advertModel
      .withScope('detailed')
      .findByPkOrThrow(id)

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

  async getAdvertsCount(): Promise<GetAdvertsStatusCounterDto> {
    const submittedCount = this.advertModel
      .unscoped()
      .countByStatus(StatusIdEnum.SUBMITTED)
    const inProgressCount = this.advertModel
      .unscoped()
      .countByStatus(StatusIdEnum.IN_PROGRESS)
    const readyForPublicationCount = this.advertModel
      .unscoped()
      .countByStatus(StatusIdEnum.READY_FOR_PUBLICATION)

    const publishedCount = this.advertModel
      .unscoped()
      .countByStatus(StatusIdEnum.PUBLISHED)

    const rejectedCount = this.advertModel
      .unscoped()
      .countByStatus(StatusIdEnum.REJECTED)

    const withdrawnCount = this.advertModel
      .unscoped()
      .countByStatus(StatusIdEnum.WITHDRAWN)

    const [
      submitted,
      inProgress,
      readyForPublication,
      published,
      rejected,
      withdrawn,
    ] = await Promise.all([
      submittedCount,
      inProgressCount,
      readyForPublicationCount,
      publishedCount,
      rejectedCount,
      withdrawnCount,
    ])

    return {
      submitted: {
        ...submitted,
        count: submitted.count + inProgress.count,
      },
      readyForPublication,
      rejected,
      published,
      withdrawn,
    }
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
      Object.assign(whereOptions, {
        [Op.or]: [
          { title: { [Op.iLike]: `%${query.search}%` } },
          { content: { [Op.iLike]: `%${query.search}%` } },
          { caption: { [Op.iLike]: `%${query.search}%` } },
        ],
      })
    }

    const order: Order = []
    const direction = query.direction || 'desc'

    if (query.sortBy === 'birting') {
      order.push([
        {
          model: AdvertPublicationModel,
          as: 'publications',
        },
        'scheduledAt',
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

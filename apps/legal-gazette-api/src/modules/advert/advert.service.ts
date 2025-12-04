import { Includeable } from 'sequelize'

import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { InjectModel } from '@nestjs/sequelize'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { generatePaging, getLimitAndOffset } from '@dmr.is/utils'

import { LegalGazetteEvents } from '../../core/constants'
import {
  AdvertDetailedDto,
  AdvertModel,
  CreateAdvertInternalDto,
  GetAdvertsDto,
  GetAdvertsQueryDto,
  GetAdvertsStatusCounterDto,
  UpdateAdvertDto,
} from '../../models/advert.model'
import { AdvertPublicationModel } from '../../models/advert-publication.model'
import { CommunicationChannelModel } from '../../models/communication-channel.model'
import { SettlementModel } from '../../models/settlement.model'
import { SignatureModel } from '../../models/signature.model'
import { StatusIdEnum } from '../../models/status.model'
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
  ) {}

  async rejectAdvert(advertId: string, currentUser: DMRUser): Promise<void> {
    const user = await this.userModel.unscoped().findOneOrThrow({
      attributes: ['id', 'nationalId'],
      where: { nationalId: currentUser.nationalId },
    })
    const advert = await this.advertModel.unscoped().findByPkOrThrow(advertId, {
      attributes: ['id', 'statusId', 'assignedUserId'],
    })

    const isEditable = advert.canEdit(user.id)

    if (!isEditable) {
      this.logger.warn(
        `User with id ${user.id} is not allowed to reject advert with id ${advertId}`,
      )

      throw new BadRequestException('User is not allowed to reject this advert')
    }

    await advert.update({ statusId: StatusIdEnum.REJECTED })

    this.eventEmitter.emit(LegalGazetteEvents.STATUS_CHANGED, {
      advertId,
      actorId: currentUser.nationalId,
      statusId: StatusIdEnum.REJECTED,
    })
  }

  async moveAdvertToNextStatus(
    advertId: string,
    currentUser: DMRUser,
  ): Promise<void> {
    const moveableStatuses = [StatusIdEnum.SUBMITTED, StatusIdEnum.IN_PROGRESS]

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

    // emit the event
    this.eventEmitter.emit(LegalGazetteEvents.STATUS_CHANGED, {
      advertId,
      actorId: currentUser.nationalId,
      statusId: nextStatusId,
    })
  }
  async moveAdvertToPreviousStatus(
    advertId: string,
    currentUser: DMRUser,
  ): Promise<void> {
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

      throw new BadRequestException('Advert cannot be moved to previous status')
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

    this.eventEmitter.emit(LegalGazetteEvents.STATUS_CHANGED, {
      advertId,
      actorId: currentUser.nationalId,
      statusId: previousStatusId,
    })
  }

  async createAdvert(
    body: CreateAdvertInternalDto,
  ): Promise<AdvertDetailedDto> {
    const includeArr: Includeable[] = [{ model: SignatureModel }]

    if (body.communicationChannels) {
      includeArr.push({ model: CommunicationChannelModel })
    }
    if (body.settlement) {
      includeArr.push({ model: SettlementModel })
    }

    this.logger.info('Creating advert', {
      body,
      context: 'AdvertService',
    })

    const advert = await this.advertModel.create(
      {
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
        signature: body.signature,
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
            }
          : undefined,
      },
      {
        returning: true,
        include: includeArr,
      },
    )

    await this.advertPublicationModel.bulkCreate(
      body.scheduledAt.map((scheduledAt, i) => ({
        advertId: advert.id,
        scheduledAt: new Date(scheduledAt),
        versionNumber: i + 1,
      })),
    )

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

    await advert.reload()

    return advert.fromModelToDetailed()
  }

  async assignAdvertToEmployee(
    advertId: string,
    userId: string,
  ): Promise<void> {
    await this.advertModel.update(
      { assignedUserId: userId },
      { where: { id: advertId } },
    )
  }

  async markAdvertAsWithdrawn(advertId: string): Promise<void> {
    const advert = await this.advertModel.unscoped().findByPkOrThrow(advertId, {
      attributes: ['id', 'statusId'],
    })

    await advert.update({ statusId: StatusIdEnum.WITHDRAWN })
  }

  async getAdvertsByCaseId(caseId: string): Promise<GetAdvertsDto> {
    const adverts = await this.advertModel.findAll({
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
    const advert = await this.advertModel.findByPkOrThrow(id)

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

    const results = await this.advertModel
      .scope([{ method: ['withQuery', query] }])
      .findAndCountAll({
        col: 'AdvertModel.id',
        distinct: true,
        limit,
        offset,
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
      this.advertModel.findByPkOrThrow(id),
    ])

    return advert.fromModelToDetailed(user?.id)
  }
}

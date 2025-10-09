import { Includeable } from 'sequelize'

import { Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { InjectModel } from '@nestjs/sequelize'

import { generatePaging, getLimitAndOffset } from '@dmr.is/utils'

import { AdvertPublicationModel } from '../advert-publications/advert-publication.model'
import { CommunicationChannelModel } from '../communication-channel/communication-channel.model'
import { SettlementModel } from '../settlement/settlement.model'
import { StatusIdEnum } from '../status/status.model'
import {
  AdvertDetailedDto,
  CreateAdvertDto,
  GetAdvertsDto,
  GetAdvertsQueryDto,
  GetAdvertsStatusCounterDto,
  UpdateAdvertDto,
} from './dto/advert.dto'
import { AdvertModel } from './advert.model'
import { IAdvertService } from './advert.service.interface'

@Injectable()
export class AdvertService implements IAdvertService {
  constructor(
    @InjectModel(AdvertModel) private readonly advertModel: typeof AdvertModel,
    @InjectModel(AdvertPublicationModel)
    private readonly advertPublicationModel: typeof AdvertPublicationModel,
    private readonly eventEmitter: EventEmitter2,
  ) {}
  async createAdvert(body: CreateAdvertDto): Promise<void> {
    const includeArr: Includeable[] = []

    if (body.communicationChannels) {
      includeArr.push({ model: CommunicationChannelModel })
    }
    if (body.settlement) {
      includeArr.push({ model: SettlementModel })
    }

    const advert = await this.advertModel.create(
      {
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
        signatureDate:
          typeof body.signatureDate === 'string'
            ? new Date(body.signatureDate)
            : body.signatureDate,
        signatureLocation: body.signatureLocation,
        signatureName: body.signatureName,
        signatureOnBehalfOf: body.signatureOnBehalfOf,
        additionalText: body.additionalText,
        divisionMeetingDate:
          typeof body.divisionMeetingDate === 'string'
            ? new Date(body.divisionMeetingDate)
            : body.divisionMeetingDate,
        divisionMeetingLocation: body.divisionMeetingLocation,
        communicationChannels: body.communicationChannels,
      },
      {
        returning: ['id'],
        include: includeArr,
      },
    )

    await this.advertPublicationModel.bulkCreate(
      body.scheduledAt.map((scheduledAt) => ({
        advertId: advert.id,
        scheduledAt: new Date(scheduledAt),
      })),
    )

    this.eventEmitter.emit('advert.created', {
      advertId: advert.id,
      statusId: body.statusId,
      actorId: body.createdByNationalId,
    })
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
  async markAdvertAsSubmitted(advertId: string): Promise<void> {
    const advert = await this.advertModel.unscoped().findByPkOrThrow(advertId, {
      attributes: ['id', 'statusId'],
    })

    await advert.update(
      { statusId: StatusIdEnum.SUBMITTED },
      { where: { id: advertId, statusId: StatusIdEnum.DRAFT } },
    )
  }
  async markAdvertAsReady(advertId: string): Promise<void> {
    const advert = await this.advertModel.unscoped().findByPkOrThrow(advertId, {
      attributes: ['id', 'statusId'],
    })

    await advert.update(
      { statusId: StatusIdEnum.READY_FOR_PUBLICATION },
      { where: { id: advertId, statusId: StatusIdEnum.DRAFT } },
    )
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

    const updated = await advert.update({
      typeId: body.typeId,
      categoryId: body.categoryId,
      title: body.title,
      content: body.content,
      signatureDate:
        typeof body.signatureDate === 'string'
          ? new Date(body.signatureDate)
          : body.signatureDate,
      signatureLocation: body.signatureLocation,
      signatureName: body.signatureName,
      signatureOnBehalfOf: body.signatureOnBehalfOf,
      additionalText: body.additionalText,
      divisionMeetingDate:
        typeof body.divisionMeetingDate === 'string'
          ? new Date(body.divisionMeetingDate)
          : body.divisionMeetingDate,
      divisionMeetingLocation: body.divisionMeetingLocation,
      caption: body.caption,
    })

    return updated.fromModelToDetailed()
  }

  async getAdvertsCount(): Promise<GetAdvertsStatusCounterDto> {
    const submittedCount = this.advertModel
      .unscoped()
      .countByStatus(StatusIdEnum.SUBMITTED)
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

    const [submitted, readyForPublication, published, rejected, withdrawn] =
      await Promise.all([
        submittedCount,
        readyForPublicationCount,
        publishedCount,
        rejectedCount,
        withdrawnCount,
      ])

    return {
      submitted,
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

  async getAdvertById(id: string): Promise<AdvertDetailedDto> {
    const advert = await this.advertModel.findByPkOrThrow(id)

    return advert.fromModelToDetailed()
  }
}

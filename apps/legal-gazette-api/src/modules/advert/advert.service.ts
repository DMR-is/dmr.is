import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { PagingQuery } from '@dmr.is/shared/dto'
import { generatePaging, getLimitAndOffset } from '@dmr.is/utils'

import { StatusIdEnum } from '../status/status.model'
import {
  AdvertDto,
  GetAdvertsDto,
  GetAdvertsQueryDto,
  GetAdvertsStatusCounterDto,
  UpdateAdvertDto,
} from './dto/advert.dto'
import { AdvertModel, AdvertModelScopes } from './advert.model'
import { IAdvertService } from './advert.service.interface'

@Injectable()
export class AdvertService implements IAdvertService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(AdvertModel) private readonly advertModel: typeof AdvertModel,
    private readonly eventEmitter: EventEmitter2,
  ) {}
  async updateAdvert(id: string, body: UpdateAdvertDto): Promise<AdvertDto> {
    const advert = await this.advertModel.findByPk(id)

    if (!advert) {
      throw new NotFoundException(`Advert not found`)
    }

    const updated = await advert.update({
      ...body,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
    })

    return updated.fromModel()
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

  async getCompletedAdverts(query: PagingQuery): Promise<GetAdvertsDto> {
    const { limit, offset } = getLimitAndOffset({
      page: query.page,
      pageSize: query.pageSize,
    })
    const adverts = await this.advertModel
      .scope(AdvertModelScopes.COMPLETED)
      .findAndCountAll({
        limit,
        offset,
      })

    const migrated = adverts.rows.map((advert) => advert.fromModel())
    const paging = generatePaging(
      migrated,
      query.page,
      query.pageSize,
      adverts.count,
    )

    return {
      adverts: migrated,
      paging,
    }
  }

  async getAdvertsInProgress(
    query: GetAdvertsQueryDto,
  ): Promise<GetAdvertsDto> {
    const { limit, offset } = getLimitAndOffset({
      page: query.page,
      pageSize: query.pageSize,
    })
    const adverts = await this.advertModel
      .scope([AdvertModelScopes.DEFAULT, { method: ['withQuery', query] }])
      .findAndCountAll({
        limit,
        offset,
      })

    const migrated = adverts.rows.map((advert) => advert.fromModel())
    const paging = generatePaging(
      migrated,
      query.page,
      query.pageSize,
      adverts.count,
    )

    return {
      adverts: migrated,
      paging,
    }
  }

  async getAdverts(query: GetAdvertsQueryDto): Promise<GetAdvertsDto> {
    const { limit, offset } = getLimitAndOffset({
      page: query.page,
      pageSize: query.pageSize,
    })

    const results = await this.advertModel
      .scope([AdvertModelScopes.PUBLISHED, { method: ['withQuery', query] }])
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

  async getAdvertById(id: string): Promise<AdvertDto> {
    const advert = await this.advertModel.findByPk(id)

    if (!advert) {
      throw new NotFoundException(`Advert with id ${id} not found`)
    }

    return advert.fromModel()
  }
}

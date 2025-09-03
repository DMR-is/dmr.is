import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { PagingQuery } from '@dmr.is/shared/dto'
import { generatePaging, getLimitAndOffset } from '@dmr.is/utils'

import { mapVersionToIndex } from '../../lib/utils'
import { AdvertPublicationModel } from '../advert-publications/advert-publication.model'
import { AdvertPublicationDetailedDto } from '../advert-publications/dto/advert-publication.dto'
import { StatusIdEnum } from '../status/status.model'
import {
  AdvertDetailedDto,
  GetAdvertsDto,
  GetAdvertsQueryDto,
  GetAdvertsStatusCounterDto,
  UpdateAdvertDto,
} from './dto/advert.dto'
import {
  AdvertModel,
  AdvertModelScopes,
  AdvertVersionEnum,
} from './advert.model'
import { IAdvertService } from './advert.service.interface'

@Injectable()
export class AdvertService implements IAdvertService {
  constructor(
    @InjectModel(AdvertModel) private readonly advertModel: typeof AdvertModel,
    @InjectModel(AdvertPublicationModel)
    private readonly advertPublicationModel: typeof AdvertPublicationModel,
  ) {}
  async getAdvertPublication(
    id: string,
    version: AdvertVersionEnum,
  ): Promise<AdvertPublicationDetailedDto> {
    const advertPromise = this.advertModel.findByPkOrThrow(id)
    const publicationPromise = this.advertPublicationModel.findOneOrThrow({
      where: {
        advertId: id,
        versionNumber: mapVersionToIndex(version),
      },
    })

    const [advert, publication] = await Promise.all([
      advertPromise,
      publicationPromise,
    ])

    return {
      advert: advert.fromModel(),
      html: advert.htmlMarkup(version),
      publication: publication.fromModel(),
    }
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
      ...body,
    })

    // TODO: update the publication scheduledAt date from body

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
    const adverts = await this.advertModel.findAndCountAll({
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

  async getAdvertById(id: string): Promise<AdvertDetailedDto> {
    const advert = await this.advertModel.findByPkOrThrow(id)

    return advert.fromModelToDetailed()
  }
}

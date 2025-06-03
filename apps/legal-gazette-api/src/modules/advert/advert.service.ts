import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { PagingQuery } from '@dmr.is/shared/dto'
import { generatePaging, getLimitAndOffset } from '@dmr.is/utils'

import { AdvertDto, GetAdvertsDto } from './dto/advert.dto'
import { advertMigrate } from './dto/advert.migrate'
import { AdvertModel } from './advert.model'
import { IAdvertService } from './advert.service.interface'

@Injectable()
export class AdvertService implements IAdvertService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(AdvertModel) private readonly advertModel: typeof AdvertModel,
    private readonly eventEmitter: EventEmitter2,
  ) {}
  async getAdvertsToBePublished(query: PagingQuery): Promise<GetAdvertsDto> {
    const { limit, offset } = getLimitAndOffset({
      page: query.page,
      pageSize: query.pageSize,
    })
    const adverts = await this.advertModel.findAndCountAll({
      limit,
      offset,
    })

    const migrated = adverts.rows.map((advert) => advertMigrate(advert))
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

  async getAdverts(query: PagingQuery): Promise<GetAdvertsDto> {
    const { limit, offset } = getLimitAndOffset({
      page: query.page,
      pageSize: query.pageSize,
    })

    const results = await this.advertModel.scope('published').findAndCountAll({
      limit,
      offset,
    })

    const migrated = results.rows.map((advert) => advertMigrate(advert))
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

    return advertMigrate(advert)
  }
}

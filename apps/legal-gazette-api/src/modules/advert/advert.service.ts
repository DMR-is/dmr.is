import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { AdvertDto, GetAdvertsDto } from './dto/advert.dto'
import { advertMigrate } from './dto/advert.migrate'
import { AdvertModel } from './advert.model'
import { IAdvertService } from './advert.service.interface'

@Injectable()
export class AdvertService implements IAdvertService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(AdvertModel) private readonly advertModel: typeof AdvertModel,
  ) {}

  async getAdverts(): Promise<GetAdvertsDto> {
    const adverts = await this.advertModel
      .scope('withPublicationNumber')
      .findAll()

    const migrated = adverts.map((advert) => advertMigrate(advert))

    return {
      adverts: migrated,
    }
  }
  async getAdvertById(id: string): Promise<AdvertDto> {
    const advert = await this.advertModel
      .scope('withPublicationNumber')
      .findByPk(id)

    if (!advert) {
      throw new NotFoundException(`Advert with id ${id} not found`)
    }

    return advertMigrate(advert)
  }
}

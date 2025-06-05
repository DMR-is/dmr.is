import slugify from 'slugify'

import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { baseEntityDetailedMigrate } from '@dmr.is/legal-gazette/dto'

import {
  CreateAdvertType,
  GetAdvertTypeDto,
  GetAdvertTypesDetailedDto,
  GetAdvertTypesDto,
  UpdateAdvertType,
} from './dto/advert-type.dto'
import { advertTypeMigrate } from './dto/advert-type.migrate'
import { AdvertTypeModel } from './advert-type.model'
import { IAdvertTypeService } from './advert-type.service.interface'

@Injectable()
export class AdvertTypeService implements IAdvertTypeService {
  constructor(
    @InjectModel(AdvertTypeModel)
    private advertTypeModel: typeof AdvertTypeModel,
  ) {}

  async createAdvertType(body: CreateAdvertType): Promise<GetAdvertTypeDto> {
    const newType = await this.advertTypeModel.create(
      {
        title: body.title,
        slug: slugify(body.title, { lower: true }),
      },
      { returning: true },
    )

    return {
      type: advertTypeMigrate(newType),
    }
  }

  async getAdvertTypes(): Promise<GetAdvertTypesDto> {
    const advertType = await this.advertTypeModel.findAll()

    return {
      types: advertType.map((advertType) => advertTypeMigrate(advertType)),
    }
  }

  async getAdvertTypesDetailed(): Promise<GetAdvertTypesDetailedDto> {
    const advertType = await this.advertTypeModel.scope('detailed').findAll()

    return {
      types: advertType.map((advertType) =>
        baseEntityDetailedMigrate(advertType),
      ),
    }
  }

  async updateAdvertType(
    id: string,
    body: UpdateAdvertType,
  ): Promise<GetAdvertTypeDto> {
    const found = await this.advertTypeModel.findByPk(id)

    if (!found) {
      throw new NotFoundException('Advert type not found')
    }

    if (!body.title) {
      return {
        type: advertTypeMigrate(found),
      }
    }

    const updatedType = await this.advertTypeModel.update(
      {
        title: body.title,
        slug: slugify(body?.title, { lower: true }),
      },
      {
        where: { id },
        returning: true,
      },
    )

    const theType = updatedType[1][0]

    return {
      type: advertTypeMigrate(theType),
    }
  }
  async deleteAdvertType(id: string): Promise<GetAdvertTypeDto> {
    const found = await this.advertTypeModel.findByPk(id)

    if (!found) {
      throw new NotFoundException('Advert type not found')
    }

    await this.advertTypeModel.destroy({ where: { id } })

    return {
      type: advertTypeMigrate(found),
    }
  }
}

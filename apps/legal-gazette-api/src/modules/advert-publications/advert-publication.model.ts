import { BulkCreateOptions, CreateOptions, Op } from 'sequelize'
import {
  AfterCreate,
  BeforeBulkCreate,
  BeforeCreate,
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
  Scopes,
} from 'sequelize-typescript'

import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../../lib/constants'
import { AdvertModel, AdvertVersionEnum } from '../advert/advert.model'
import { TypeIdEnum } from '../type/type.model'
import { AdvertPublicationDto } from './dto/advert-publication.dto'

export type AdvertPublicationsAttributes = {
  advertId: string
  scheduledAt: Date
  publishedAt: Date | null
  versionNumber: number
}

export type AdvertPublicationsCreateAttributes = {
  advertId?: string
  scheduledAt: Date
  publishedAt?: Date | null
  versionNumber?: number
}

@BaseTable({ tableName: LegalGazetteModels.ADVERT_PUBLICATION })
@DefaultScope(() => ({
  order: [['scheduledAt', 'ASC']],
}))
@Scopes(() => ({
  published: {
    where: {
      publishedAt: {
        [Op.ne]: null,
      },
    },
    order: [['publishedAt', 'DESC']],
  },
}))
export class AdvertPublicationModel extends BaseModel<
  AdvertPublicationsAttributes,
  AdvertPublicationsCreateAttributes
> {
  @Column({ type: DataType.UUID, allowNull: false })
  @ForeignKey(() => AdvertModel)
  advertId!: string

  @Column({ type: DataType.DATE, allowNull: false })
  scheduledAt!: Date

  @Column({ type: DataType.DATE })
  publishedAt!: Date | null

  @Column({ type: DataType.INTEGER, defaultValue: '1' })
  versionNumber!: number

  @Column({ type: DataType.VIRTUAL })
  get isPublished(): boolean {
    return this.publishedAt !== null
  }

  @Column({ type: DataType.VIRTUAL })
  get versionLetter(): AdvertVersionEnum {
    const letter = String.fromCharCode(64 + this.versionNumber)

    if (
      Object.values(AdvertVersionEnum).includes(letter as AdvertVersionEnum)
    ) {
      return letter as AdvertVersionEnum
    }

    throw new Error('Invalid version letter')
  }

  @BelongsTo(() => AdvertModel)
  advert!: AdvertModel

  @BeforeCreate
  static async validate(model: AdvertPublicationModel) {
    const advert = await AdvertModel.unscoped().findByPkOrThrow(
      model.advertId,
      {
        attributes: ['id', 'typeId'],
      },
    )

    switch (advert.typeId) {
      case TypeIdEnum.DIVISION_MEETING: {
        if (model.versionNumber > 1) {
          throw new BadRequestException(
            'Division meeting adverts can only have one version',
          )
        }

        break
      }
      default: {
        if (model.versionNumber > 3) {
          throw new BadRequestException(
            'Max three versions are allowed for this advert type',
          )
        }
      }
    }
  }

  @BeforeBulkCreate
  static async testing(
    _instances: AdvertPublicationModel[],
    options: BulkCreateOptions,
  ) {
    options.individualHooks = true
  }

  static fromModel(model: AdvertPublicationModel): AdvertPublicationDto {
    return {
      id: model.id,
      advertId: model.advertId,
      scheduledAt: model.scheduledAt.toISOString(),
      publishedAt: model.publishedAt ? model.publishedAt.toISOString() : null,
      version: model.versionLetter,
    }
  }

  fromModel(): AdvertPublicationDto {
    return AdvertPublicationModel.fromModel(this)
  }
}

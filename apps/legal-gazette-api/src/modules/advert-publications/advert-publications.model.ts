import { Op } from 'sequelize'
import {
  BeforeCreate,
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
  Scopes,
} from 'sequelize-typescript'

import { InternalServerErrorException } from '@nestjs/common'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../../lib/constants'
import { AdvertModel } from '../advert/advert.model'
import { TypeIdEnum } from '../type/type.model'

export type AdvertPublicationsAttributes = {
  advertId: string
  scheduledAt: Date
  publishedAt: Date | null
  versionNumber: number
}

export type AdvertPublicationsCreateAttributes = {
  advertId: string
  scheduledAt: Date
}

@BaseTable({ tableName: LegalGazetteModels.ADVERT_PUBLICATIONS })
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
export class AdvertPublicationsModel extends BaseModel<
  AdvertPublicationsAttributes,
  AdvertPublicationsCreateAttributes
> {
  @Column({ type: DataType.UUID, allowNull: false })
  @ForeignKey(() => AdvertModel)
  advertId!: string

  @Column({ type: DataType.DATE, allowNull: false })
  scheduledAt!: Date

  @Column({ type: DataType.DATE, allowNull: true })
  publishedAt!: Date | null

  @Column({ type: DataType.INTEGER, allowNull: false })
  versionNumber!: number

  @Column({ type: DataType.VIRTUAL, allowNull: false })
  get isPublished(): boolean {
    return this.publishedAt !== null
  }

  @Column({ type: DataType.VIRTUAL, allowNull: false })
  get versionLetter(): string {
    return String.fromCharCode(64 + this.versionNumber)
  }

  @BelongsTo(() => AdvertModel)
  advert!: AdvertModel

  @BeforeCreate
  static async validateInsertAndComputeVersionNumber(
    instance: AdvertPublicationsModel,
  ) {
    const advertPublication = await AdvertPublicationsModel.findOne({
      where: { id: instance.id },
      include: [
        { model: AdvertModel, attributes: ['id', 'typeId'], required: true },
      ],
    })

    if (!advertPublication || !advertPublication.advert) {
      this.logger.error('Advert not found', {
        advertId: instance.advertId,
        publicationId: instance.id,
      })
      throw new InternalServerErrorException('Advert not found')
    }

    const currentVersion = await AdvertPublicationsModel.max<
      number | null,
      AdvertPublicationsModel
    >('versionNumber', {
      where: { advertId: instance.advertId },
    })

    const nextVersion = (currentVersion || 0) + 1

    const { advert } = advertPublication

    switch (advert.typeId) {
      case TypeIdEnum.DIVISION_MEETING: {
        if (nextVersion >= 1) {
          throw new InternalServerErrorException(
            'Division Meeting can only have one publication',
          )
        }

        break
      }
      default: {
        if (nextVersion >= 3) {
          throw new InternalServerErrorException(
            'Advert can only have up to 3 publications',
          )
        }

        break
      }
    }

    instance.versionNumber = nextVersion
    instance.save()
  }
}

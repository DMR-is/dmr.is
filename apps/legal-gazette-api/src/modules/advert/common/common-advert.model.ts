import {
  BeforeUpdate,
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
} from 'sequelize-typescript'

import { BadRequestException } from '@nestjs/common'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../../../lib/constants'
import { validateAdvertStatus } from '../../../lib/utils'
import { AdvertModel } from '../advert.model'
import { CommonAdvertDto } from './dto/common-advert.dto'

type CommonAdvertAttributes = {
  advertId: string
  islandIsApplicationId?: string
  caption: string
  signatureName: string
  signatureLocation: string
  signatureDate: Date
}

export type CommonAdvertCreationAttributes = {
  advertId?: string
  islandIsApplicationId?: string
  caption: string
  signatureName: string
  signatureLocation: string
  signatureDate: Date
}

@BaseTable({ tableName: LegalGazetteModels.COMMON_ADVERT })
@DefaultScope(() => ({
  attributes: [
    'id',
    'advertId',
    'caption',
    'signatureName',
    'signatureLocation',
    'signatureDate',
  ],
}))
export class CommonAdvertModel extends BaseModel<
  CommonAdvertAttributes,
  CommonAdvertCreationAttributes
> {
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'advert_id',
  })
  @ForeignKey(() => AdvertModel)
  advertId!: string

  @Column({
    type: DataType.UUID,
    field: 'island_is_application_id',
  })
  island_is_application_id?: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'caption',
  })
  caption!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'signature_name',
  })
  signatureName!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'signature_location',
  })
  signatureLocation!: string

  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'signature_date',
  })
  signatureDate!: Date

  @BelongsTo(() => AdvertModel, { foreignKey: 'advertId' })
  advert?: AdvertModel

  @BeforeUpdate
  static validateAdvertStatus(instance: CommonAdvertModel): void {
    if (!instance.advert?.statusId) {
      this.logger.warn('Cannot update common advert without advert status id')

      throw new BadRequestException('Cannot update advert in this status')
    }

    validateAdvertStatus(instance.advert)
  }

  static fromModel(model: CommonAdvertModel): CommonAdvertDto {
    try {
      return {
        caption: model.caption,
        signature: {
          name: model.signatureName,
          location: model.signatureLocation,
          date: model.signatureDate.toISOString(),
        },
      }
    } catch (error) {
      this.logger.warn(
        'fromModel failed for CommonAdvertModel, did you include everything?',
      )
      throw error
    }
  }

  fromModel(): CommonAdvertDto {
    return CommonAdvertModel.fromModel(this)
  }
}

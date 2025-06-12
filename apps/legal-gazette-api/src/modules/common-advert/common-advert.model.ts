import { BelongsTo, Column, DataType, DefaultScope } from 'sequelize-typescript'

import { LegalGazetteModels } from '@dmr.is/legal-gazette/constants'
import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { AdvertModel } from '../advert/advert.model'
import { CommonAdvertDto } from './dto/common-advert.dto'

type CommonAdvertAttributes = {
  caption: string
  signatureName: string
  signatureLocation: string
  signatureDate: Date
}

export type CommonAdvertCreationAttributes = CommonAdvertAttributes

@BaseTable({ tableName: LegalGazetteModels.COMMON_ADVERT })
@DefaultScope(() => ({
  attributes: [
    'id',
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

  @BelongsTo(() => AdvertModel, { foreignKey: 'id' })
  advert!: AdvertModel

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
        {
          context: 'CommonAdvertModel.fromModel',
        },
      )
      throw error
    }
  }

  fromModel(): CommonAdvertDto {
    return CommonAdvertModel.fromModel(this)
  }
}

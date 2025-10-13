import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
  HasMany,
} from 'sequelize-typescript'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../../lib/constants'
import { AdvertModel } from '../advert/advert.model'
import { ForeclosureDto } from './dto/foreclosure.dto'
import {
  ForeclosurePropertyModel,
  ForeclosurePropertyModelCreateAttributes,
} from './foreclosure-property.model'

type ForeclosureModelAttributes = {
  advertId: string
  foreclosureRegion: string
  foreclosureAddress: string
  foreclosureDate: Date
  authorityLocation: string
}

type ForeclosureModelCreateAttributes = {
  advertId?: string
  foreclosureRegion: string
  foreclosureAddress: string
  foreclosureDate: Date
  authorityLocation: string
  properties?: ForeclosurePropertyModelCreateAttributes[]
}

@BaseTable({ tableName: LegalGazetteModels.FORECLOSURE })
@DefaultScope(() => ({
  include: [
    {
      model: ForeclosurePropertyModel,
      as: 'properties',
    },
  ],
}))
export class ForeclosureModel extends BaseModel<
  ForeclosureModelAttributes,
  ForeclosureModelCreateAttributes
> {
  @Column({ type: DataType.UUID, allowNull: false })
  @ForeignKey(() => AdvertModel)
  advertId!: string

  @Column({ type: DataType.STRING, allowNull: false })
  foreclosureRegion!: string

  @Column({ type: DataType.STRING, allowNull: false })
  foreclosureAddress!: string

  @Column({ type: DataType.DATE, allowNull: false })
  foreclosureDate!: Date

  @Column({ type: DataType.STRING, allowNull: false })
  authorityLocation!: string

  @BelongsTo(() => AdvertModel)
  advert!: AdvertModel

  @HasMany(() => ForeclosurePropertyModel)
  properties!: ForeclosurePropertyModel[]

  static fromModel(model: ForeclosureModel): ForeclosureDto {
    return {
      id: model.id,
      createdAt: model.createdAt.toISOString(),
      updatedAt: model.updatedAt.toISOString(),
      advertId: model.advertId,
      foreclosureRegion: model.foreclosureRegion,
      foreclosureAddress: model.foreclosureAddress,
      foreclosureDate: model.foreclosureDate.toISOString(),
      properties: model.properties.map((property) => property.fromModel()),
    }
  }

  fromModel(): ForeclosureDto {
    return ForeclosureModel.fromModel(this)
  }
}

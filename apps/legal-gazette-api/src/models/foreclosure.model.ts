import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
  HasMany,
} from 'sequelize-typescript'

import {
  ApiDateTime,
  ApiDtoArray,
  ApiOptionalString,
  ApiString,
  ApiUUId,
} from '@dmr.is/decorators'
import { BaseModel, BaseTable } from '@dmr.is/shared-models-base'

import { LegalGazetteModels } from '../core/constants'
import { AdvertModel } from './advert.model'
import {
  ForeclosurePropertyDto,
  ForeclosurePropertyModel,
  ForeclosurePropertyModelCreateAttributes,
} from './foreclosure-property.model'

type ForeclosureModelAttributes = {
  advertId: string
  caseNumberIdentifier: string | null
  foreclosureRegion: string
  foreclosureAddress: string
  foreclosureDate: Date
}

type ForeclosureModelCreateAttributes = {
  advertId?: string
  caseNumberIdentifier?: string | null
  foreclosureRegion: string
  foreclosureAddress: string
  foreclosureDate: Date
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

  @Column({ type: DataType.TEXT, allowNull: true, defaultValue: null })
  caseNumberIdentifier!: string | null

  @Column({ type: DataType.STRING, allowNull: false })
  foreclosureRegion!: string

  @Column({ type: DataType.STRING, allowNull: false })
  foreclosureAddress!: string

  @Column({ type: DataType.DATE, allowNull: false })
  foreclosureDate!: Date

  @BelongsTo(() => AdvertModel)
  advert!: AdvertModel

  @HasMany(() => ForeclosurePropertyModel)
  properties!: ForeclosurePropertyModel[]

  static fromModel(model: ForeclosureModel): ForeclosureDto {
    return {
      id: model.id,
      caseNumberIdentifier: model.caseNumberIdentifier,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      advertId: model.advertId,
      foreclosureRegion: model.foreclosureRegion,
      foreclosureAddress: model.foreclosureAddress,
      foreclosureDate: model.foreclosureDate,
      properties: model.properties.map((property) => property.fromModel()),
    }
  }

  fromModel(): ForeclosureDto {
    return ForeclosureModel.fromModel(this)
  }
}

export class ForeclosureDto {
  @ApiUUId()
  id!: string

  @ApiUUId()
  advertId!: string

  @ApiOptionalString({ nullable: true })
  caseNumberIdentifier!: string | null

  @ApiString()
  foreclosureRegion!: string

  @ApiString()
  foreclosureAddress!: string

  @ApiDateTime()
  foreclosureDate!: Date

  @ApiDateTime()
  createdAt!: Date

  @ApiDateTime()
  updatedAt!: Date

  @ApiDtoArray(ForeclosurePropertyDto)
  properties!: ForeclosurePropertyDto[]
}

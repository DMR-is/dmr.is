// Association annotations use a type-only alias - see `models.md`.
import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
  HasMany,
} from 'sequelize-typescript'

import { ParanoidModel, ParanoidTable } from '@dmr.is/shared-models-base'

import { LegalGazetteModels } from '../core/constants'
import type { AdvertModel as AdvertModelRef } from './advert.model'
import { AdvertModel } from './advert.model'
// Type-only: the DTO is only ever a mapper return type here. See `models.md`.
import type { ForeclosureDto } from './foreclosure.dto'
import {
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

@ParanoidTable({ tableName: LegalGazetteModels.FORECLOSURE })
@DefaultScope(() => ({
  include: [
    {
      model: ForeclosurePropertyModel,
      as: 'properties',
    },
  ],
}))
export class ForeclosureModel extends ParanoidModel<
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
  advert!: AdvertModelRef

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

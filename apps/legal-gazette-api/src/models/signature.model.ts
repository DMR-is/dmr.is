import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import {
  ApiOptionalDateTime,
  ApiOptionalString,
  ApiUUId,
} from '@dmr.is/decorators'
import { BaseModel, BaseTable } from '@dmr.is/shared-models-base'

import { LegalGazetteModels } from '../core/constants'
import { DetailedDto } from '../modules/shared/dto/detailed.dto'
import { AdvertModel } from './advert.model'

type SignatureAttributes = {
  name: string | null
  location: string | null
  date: Date | null
  onBehalfOf: string | null
  advertId: string
}

export type SignatureCreationAttributes = {
  name?: string | null
  location?: string | null
  date?: Date | null
  onBehalfOf?: string | null
  advertId?: string
}

@BaseTable({ tableName: LegalGazetteModels.SIGNATURE })
export class SignatureModel extends BaseModel<
  SignatureAttributes,
  SignatureCreationAttributes
> {
  @Column({ type: DataType.TEXT, allowNull: true, defaultValue: null })
  name?: string | null

  @Column({ type: DataType.TEXT, allowNull: true, defaultValue: null })
  location?: string | null

  @Column({ type: DataType.DATE, allowNull: true, defaultValue: null })
  date?: Date | null

  @Column({ type: DataType.TEXT, allowNull: true, defaultValue: null })
  onBehalfOf?: string | null

  @Column({ type: DataType.UUID, allowNull: false })
  @ForeignKey(() => AdvertModel)
  advertId!: string

  @BelongsTo(() => AdvertModel)
  advert!: AdvertModel

  static fromModel(model: SignatureModel): SignatureDto {
    return {
      id: model.id,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      deletedAt: model.deletedAt ?? undefined,
      advertId: model.advertId,
      name: model.name ?? undefined,
      location: model.location ?? undefined,
      date: model.date ?? undefined,
      onBehalfOf: model.onBehalfOf ?? undefined,
    }
  }

  fromModel(): SignatureDto {
    return SignatureModel.fromModel(this)
  }
}
export class SignatureDto extends DetailedDto {
  @ApiUUId()
  advertId!: string

  @ApiOptionalString()
  name?: string

  @ApiOptionalString()
  location?: string

  @ApiOptionalDateTime()
  date?: Date

  @ApiOptionalString()
  onBehalfOf?: string
}

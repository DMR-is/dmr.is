import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
} from 'sequelize-typescript'

import { ApiDateTime, ApiNumber, ApiString, ApiUUId } from '@dmr.is/decorators'
import { BaseModel, BaseTable } from '@dmr.is/shared-models-base'

import { LegalGazetteModels } from '../core/constants'
import { ForeclosureModel } from './foreclosure.model'

export type ForeclosurePropertyModelAttributes = {
  foreclosureId: string
  propertyName: string
  propertyNumber: string
  propertyTotalPrice: number
  claimant: string
  respondent: string
}

export type ForeclosurePropertyModelCreateAttributes = {
  foreclosureId?: string
  propertyName: string
  propertyNumber: string
  propertyTotalPrice: number
  claimant: string
  respondent: string
}

@BaseTable({ tableName: LegalGazetteModels.FORECLOSURE_PROPERTY })
@DefaultScope(() => ({
  include: [],
  orderBy: [['propertyName', 'ASC']],
}))
export class ForeclosurePropertyModel extends BaseModel<
  ForeclosurePropertyModelAttributes,
  ForeclosurePropertyModelCreateAttributes
> {
  @Column({ type: DataType.UUID, allowNull: false })
  @ForeignKey(() => ForeclosureModel)
  foreclosureId!: string

  @Column({ type: DataType.TEXT, allowNull: false })
  propertyName!: string

  @Column({ type: DataType.TEXT, allowNull: false })
  propertyNumber!: string

  @Column({ type: DataType.INTEGER, allowNull: false })
  propertyTotalPrice!: number

  @Column({ type: DataType.TEXT, allowNull: false })
  claimant!: string

  @Column({ type: DataType.TEXT, allowNull: false })
  respondent!: string

  @BelongsTo(() => ForeclosureModel)
  foreclosure!: ForeclosureModel

  static fromModel(model: ForeclosurePropertyModel): ForeclosurePropertyDto {
    return {
      id: model.id,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      foreclosureId: model.foreclosureId,
      propertyName: model.propertyName,
      propertyNumber: model.propertyNumber,
      propertyTotalPrice: model.propertyTotalPrice,
      claimant: model.claimant,
      respondent: model.respondent,
    }
  }

  fromModel() {
    return ForeclosurePropertyModel.fromModel(this)
  }
}

export class ForeclosurePropertyDto {
  @ApiUUId()
  id!: string

  @ApiUUId()
  foreclosureId!: string

  @ApiString()
  propertyName!: string

  @ApiString()
  propertyNumber!: string

  @ApiNumber()
  propertyTotalPrice!: number

  @ApiString()
  claimant!: string

  @ApiString()
  respondent!: string

  @ApiDateTime()
  createdAt!: Date

  @ApiDateTime()
  updatedAt!: Date
}

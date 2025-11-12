import { IsNumber, IsString } from 'class-validator'
import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
} from 'sequelize-typescript'

import { ApiProperty, PickType } from '@nestjs/swagger'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../lib/constants'
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
  @ApiProperty({ type: String })
  foreclosureId!: string

  @Column({ type: DataType.TEXT, allowNull: false })
  @ApiProperty({ type: String })
  propertyName!: string

  @Column({ type: DataType.TEXT, allowNull: false })
  @ApiProperty({ type: String })
  propertyNumber!: string

  @Column({ type: DataType.INTEGER, allowNull: false })
  @ApiProperty({ type: Number })
  propertyTotalPrice!: number

  @Column({ type: DataType.TEXT, allowNull: false })
  @ApiProperty({ type: String })
  claimant!: string

  @Column({ type: DataType.TEXT, allowNull: false })
  @ApiProperty({ type: String })
  respondent!: string

  @BelongsTo(() => ForeclosureModel)
  foreclosure!: ForeclosureModel

  static fromModel(model: ForeclosurePropertyModel): ForeclosurePropertyDto {
    return {
      id: model.id,
      createdAt: model.createdAt.toISOString(),
      updatedAt: model.updatedAt.toISOString(),
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

export class ForeclosurePropertyDto extends PickType(ForeclosurePropertyModel, [
  'id',
  'foreclosureId',
  'propertyName',
  'propertyNumber',
  'propertyTotalPrice',
  'claimant',
  'respondent',
] as const) {
  @ApiProperty({ type: String })
  createdAt!: string

  @ApiProperty({ type: String })
  updatedAt!: string
}

export class CreateForeclosurePropertyDto {
  @ApiProperty({ type: String })
  @IsString()
  propertyName!: string

  @ApiProperty({ type: String })
  @IsString()
  propertyNumber!: string

  @ApiProperty({ type: Number })
  @IsNumber()
  propertyTotalPrice!: number

  @ApiProperty({ type: String })
  @IsString()
  claimant!: string

  @ApiProperty({ type: String })
  @IsString()
  respondent!: string
}

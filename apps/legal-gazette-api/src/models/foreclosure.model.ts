import { Type } from 'class-transformer'
import {
  IsArray,
  IsDateString,
  IsString,
  ValidateNested,
} from 'class-validator'
import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
  HasMany,
} from 'sequelize-typescript'

import { ApiProperty, PickType } from '@nestjs/swagger'

import { BaseModel, BaseTable } from '@dmr.is/shared-models-base'

import { LegalGazetteModels } from '../core/constants'
import { ObjectIssuer } from '../modules/external-systems/external-systems.dto'
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
  @ApiProperty({ type: String })
  advertId!: string

  @Column({ type: DataType.TEXT, allowNull: true, defaultValue: null })
  @ApiProperty({
    type: String,
    description: 'The ID of the foreclosure',
    nullable: true,
  })
  @IsString()
  caseNumberIdentifier!: string | null

  @ApiProperty({
    type: String,
    description: 'The ID of the advert the foreclosure belongs to',
  })
  @ApiProperty({
    type: String,
    description: 'The land region of where the foreclosure is located',
  })
  foreclosureRegion!: string

  @Column({ type: DataType.STRING, allowNull: false })
  @ApiProperty({ type: String, description: 'The address of the foreclosure' })
  foreclosureAddress!: string

  @Column({ type: DataType.DATE, allowNull: false })
  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'The date of the foreclosure',
  })
  @IsDateString()
  foreclosureDate!: Date

  @BelongsTo(() => AdvertModel)
  advert!: AdvertModel

  @HasMany(() => ForeclosurePropertyModel)
  properties!: ForeclosurePropertyModel[]

  static fromModel(model: ForeclosureModel): ForeclosureDto {
    return {
      id: model.id,
      caseNumberIdentifier: model.caseNumberIdentifier,
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

export class ForeclosureDto extends PickType(ForeclosureModel, [
  'id',
  'advertId',
  'caseNumberIdentifier',
  'foreclosureRegion',
  'foreclosureAddress',
] as const) {
  @ApiProperty({ type: String })
  @IsDateString()
  foreclosureDate!: string

  @ApiProperty({ type: String })
  createdAt!: string

  @ApiProperty({ type: String })
  updatedAt!: string

  @ApiProperty({
    type: [ForeclosurePropertyDto],
    description: 'List of all the properties listed in the foreclosure',
  })
  @IsArray()
  @Type(() => ForeclosurePropertyDto)
  @ValidateNested({ each: true })
  properties!: ForeclosurePropertyDto[]
}

export class CreateForeclosureSaleDto extends PickType(ForeclosureDto, [
  'properties',
] as const) {
  @ApiProperty({
    type: String,
    description: 'The ID of the foreclosure',
    nullable: true,
  })
  @IsString()
  caseNumberIdentifier!: string | null

  @ApiProperty({
    type: String,
    description: 'The land region of where the foreclosure is located',
  })
  @IsString()
  foreclosureRegion!: string

  @ApiProperty({ type: String, description: 'The address of the foreclosure' })
  @IsString()
  foreclosureAddress!: string

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'The date of the foreclosure',
  })
  @IsDateString()
  foreclosureDate!: string

  @ApiProperty({
    type: ObjectIssuer,
    description: 'The responsible party for the foreclosure',
  })
  @ValidateNested()
  @Type(() => ObjectIssuer)
  responsibleParty!: ObjectIssuer
}

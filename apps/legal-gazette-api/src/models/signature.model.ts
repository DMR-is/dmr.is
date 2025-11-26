import { IsOptional, IsString } from 'class-validator'
import { Column, DataType } from 'sequelize-typescript'

import { ApiProperty } from '@nestjs/swagger'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../core/constants'

type SignatureAttributes = {
  name: string | null
  location: string | null
  date: Date | null
  onBehalfOf: string | null
}

export type SignatureCreationAttributes = {
  name?: string | null
  location?: string | null
  date?: Date | null
  onBehalfOf?: string | null
}

@BaseTable({ tableName: LegalGazetteModels.SIGNATURE })
export class SignatureModel extends BaseModel<
  SignatureAttributes,
  SignatureCreationAttributes
> {
  @Column({ type: DataType.TEXT, allowNull: true })
  name!: string | null

  @Column({ type: DataType.TEXT, allowNull: true })
  location!: string | null

  @Column({ type: DataType.DATE, allowNull: true })
  date!: Date | null

  @Column({ type: DataType.TEXT, allowNull: true })
  onBehalfOf!: string | null

  static fromModel(model: SignatureModel): SignatureDto {
    return {
      name: model.name ?? undefined,
      location: model.location ?? undefined,
      date: model.date?.toISOString(),
      onBehalfOf: model.onBehalfOf ?? undefined,
    }
  }

  fromModel(): SignatureDto {
    return SignatureModel.fromModel(this)
  }
}

export class SignatureDto {
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  name?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  location?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  date?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  onBehalfOf?: string
}

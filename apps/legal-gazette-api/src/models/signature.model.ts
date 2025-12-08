import { Transform } from 'class-transformer'
import { IsDate, IsOptional, IsString, IsUUID } from 'class-validator'
import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { ApiProperty } from '@nestjs/swagger'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../core/constants'
import { DetailedDto } from '../core/dto/detailed.dto'
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
  date?: Date | string | null
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
      createdAt: model.createdAt.toISOString(),
      updatedAt: model.updatedAt.toISOString(),
      deletedAt: model.deletedAt?.toISOString(),
      advertId: model.advertId,
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
export class SignatureDto extends DetailedDto {
  @ApiProperty({ type: String })
  @IsUUID()
  advertId!: string

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

export class UpdateSignatureDto {
  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @IsDate()
  @Transform(({ value }) => (value ? new Date(value) : null))
  date?: Date | null

  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @IsString()
  name?: string | null
  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @IsString()
  location?: string | null
  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @IsString()
  onBehalfOf?: string | null
}

export class CreateSignatureDto extends UpdateSignatureDto {}

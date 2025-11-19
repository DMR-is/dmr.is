import { Type } from 'class-transformer'
import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator'
import {
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
} from 'sequelize-typescript'

import {
  ApiProperty,
  IntersectionType,
  PartialType,
  PickType,
} from '@nestjs/swagger'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../core/constants'
import { DetailedDto } from '../core/dto/detailed.dto'
import { AdvertModel } from './advert.model'

type CommunicationChannelAttributes = {
  advertId: string
  email: string
  name?: string | null
  phone?: string | null
}

export type CommunicationChannelCreateAttributes = {
  email: string
  advertId?: string
  name?: string | null
  phone?: string | null
}

@BaseTable({ tableName: LegalGazetteModels.COMMUNICATION_CHANNEL })
@DefaultScope(() => ({
  attributes: ['id', 'advertId', 'email', 'name', 'phone'],
  order: [['name', 'ASC']],
}))
export class CommunicationChannelModel extends BaseModel<
  CommunicationChannelAttributes,
  CommunicationChannelCreateAttributes
> {
  @ForeignKey(() => AdvertModel)
  @Column({ type: DataType.UUID, allowNull: false })
  @ApiProperty({ type: String })
  advertId!: string

  @Column({
    type: DataType.TEXT,
  })
  @ApiProperty({ type: String })
  email!: string

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  @ApiProperty({ type: String, required: false })
  name?: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  @ApiProperty({ type: String, required: false })
  phone?: string | null

  static fromModel(model: CommunicationChannelModel): CommunicationChannelDto {
    return {
      id: model.id,
      advertId: model.advertId,
      email: model.email,
      name: model.name ?? undefined,
      phone: model.phone ?? undefined,
    }
  }

  fromModel(): CommunicationChannelDto {
    return CommunicationChannelModel.fromModel(this)
  }
}

export class CreateCommunicationChannelDto {
  @ApiProperty({ type: String })
  @IsEmail()
  email!: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  @MinLength(0)
  @MaxLength(255)
  name?: string

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(0)
  @MaxLength(255)
  phone?: string
}

export class CommunicationChannelDto extends PickType(
  CommunicationChannelModel,
  ['id', 'advertId', 'email', 'name', 'phone'],
) {}

export class GetCommunicationChannelsDto {
  @ApiProperty({
    type: [CommunicationChannelDto],
  })
  @IsArray()
  @Type(() => CommunicationChannelDto)
  @ValidateNested({ each: true })
  channels!: CommunicationChannelDto[]
}

export class CommunicationChannelDetailedDto extends IntersectionType(
  CommunicationChannelDto,
  DetailedDto,
) {}

export class UpdateCommunicationChannelDto extends PartialType(
  CreateCommunicationChannelDto,
) {}

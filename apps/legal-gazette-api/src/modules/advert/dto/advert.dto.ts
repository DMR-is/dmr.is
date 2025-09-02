import { Transform, Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { Paging, PagingQuery } from '@dmr.is/shared/dto'

import { DetailedDto } from '../../../dto/detailed.dto'
import { AdvertPublicationDto } from '../../advert-publications/dto/advert-publication.dto'
import { CategoryDto } from '../../category/dto/category.dto'
import { StatusDto } from '../../status/dto/status.dto'
import { StatusIdEnum } from '../../status/status.model'
import { TypeDto } from '../../type/dto/type.dto'
import { AdvertVersionEnum } from '../advert.model'
export class AdvertDto extends DetailedDto {
  @ApiProperty({
    type: String,
  })
  @IsUUID()
  id!: string

  @ApiProperty({
    type: String,
  })
  @IsUUID()
  caseId!: string

  @ApiProperty({
    type: String,
    nullable: true,
  })
  @IsUUID()
  publicationNumber!: string | null

  @ApiProperty({
    type: String,
  })
  @IsString()
  title!: string

  @ApiProperty({
    type: String,
  })
  @IsString()
  createdBy!: string

  @ApiProperty({ type: TypeDto })
  @Type(() => TypeDto)
  @ValidateNested()
  type!: TypeDto

  @ApiProperty({ type: CategoryDto })
  @Type(() => CategoryDto)
  @ValidateNested()
  category!: CategoryDto

  @ApiProperty({ type: StatusDto })
  @Type(() => StatusDto)
  @ValidateNested()
  status!: StatusDto

  @ApiProperty({
    enum: AdvertVersionEnum,
    enumName: 'AdvertVersion',
  })
  version!: AdvertVersionEnum

  @ApiProperty({
    type: String,
  })
  @IsString()
  html!: string

  @ApiProperty({
    type: Boolean,
  })
  @IsBoolean()
  paid!: boolean

  @ApiProperty({ type: String })
  @IsString()
  signatureName!: string

  @ApiProperty({ type: String })
  @IsString()
  signatureLocation!: string

  @ApiProperty({ type: String })
  @IsDateString()
  signatureDate!: string

  @ApiProperty({ type: [AdvertPublicationDto] })
  publications!: AdvertPublicationDto[]
}

export class GetAdvertsDto {
  @ApiProperty({
    type: [AdvertDto],
  })
  adverts!: AdvertDto[]

  @ApiProperty({
    type: Paging,
  })
  paging!: Paging
}

export class GetAdvertsQueryDto extends PagingQuery {
  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string

  @ApiProperty({
    enum: StatusIdEnum,
    enumName: 'StatusIdEnum',
    'x-enumNames': [
      'Submitted',
      'ReadyForPublication',
      'Published',
      'Rejected',
      'Withdrawn',
    ],
    isArray: true,
    required: false,
  })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsOptional()
  @IsArray()
  @IsEnum(StatusIdEnum, { each: true })
  statusId?: StatusIdEnum[]

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsUUID()
  typeId?: string

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => (value ? new Date(value).toISOString() : null))
  dateFrom?: string

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => (value ? new Date(value).toISOString() : null))
  dateTo?: string

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string
}

export class AdvertStatusCounterItemDto {
  @ApiProperty({
    type: StatusDto,
  })
  @Type(() => StatusDto)
  @ValidateNested()
  status!: StatusDto

  @ApiProperty({
    type: Number,
  })
  count!: number
}

export class GetAdvertsStatusCounterDto {
  @ApiProperty({
    type: AdvertStatusCounterItemDto,
  })
  @Type(() => AdvertStatusCounterItemDto)
  @ValidateNested()
  submitted!: AdvertStatusCounterItemDto

  @ApiProperty({
    type: AdvertStatusCounterItemDto,
  })
  @Type(() => AdvertStatusCounterItemDto)
  @ValidateNested()
  readyForPublication!: AdvertStatusCounterItemDto

  @ApiProperty({
    type: AdvertStatusCounterItemDto,
  })
  @Type(() => AdvertStatusCounterItemDto)
  @ValidateNested()
  withdrawn!: AdvertStatusCounterItemDto

  @ApiProperty({
    type: AdvertStatusCounterItemDto,
  })
  @Type(() => AdvertStatusCounterItemDto)
  @ValidateNested()
  rejected!: AdvertStatusCounterItemDto

  @ApiProperty({
    type: AdvertStatusCounterItemDto,
  })
  @Type(() => AdvertStatusCounterItemDto)
  @ValidateNested()
  published!: AdvertStatusCounterItemDto
}

export class UpdateAdvertDto {
  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  html?: string
}

export class PublishAdvertsBody {
  @ApiProperty({
    type: [String],
  })
  @IsArray()
  @IsUUID(undefined, { each: true })
  advertIds!: string[]
}

export class CreateAdvertDto {
  @ApiProperty({
    type: String,
  })
  @IsString()
  title!: string

  @ApiProperty({
    type: String,
  })
  @IsUUID()
  typeId!: string

  @ApiProperty({
    type: String,
  })
  @IsUUID()
  categoryId!: string

  @ApiProperty({
    type: String,
  })
  @IsDateString()
  scheduledAt!: string
}

import { Transform, Type } from 'class-transformer'
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
  ValidateNested,
} from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { DetailedDto } from '@dmr.is/legal-gazette/dto'
import { Paging, PagingQuery } from '@dmr.is/shared/dto'

import { AdvertCategoryDto } from '../../advert-category/dto/advert-category.dto'
import { AdvertStatusIdEnum } from '../../advert-status/advert-status.model'
import { AdvertStatusDto } from '../../advert-status/dto/advert-status.dto'
import { AdvertTypeDto } from '../../advert-type/dto/advert-type.dto'
import { CommonAdvertDto } from '../../common-advert/dto/common-advert.dto'
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
  })
  @IsUUID()
  publicationNumber!: string

  @ApiProperty({
    type: String,
  })
  @IsString()
  title!: string

  @ApiProperty({
    type: String,
    nullable: true,
  })
  @ValidateIf((o) => o.publishedAt !== null)
  @IsDateString()
  publishedAt!: string | null

  @ApiProperty({ type: String })
  @IsDateString()
  scheduledAt!: string

  @ApiProperty({ type: AdvertTypeDto })
  @Type(() => AdvertTypeDto)
  @ValidateNested()
  type!: AdvertTypeDto

  @ApiProperty({ type: AdvertCategoryDto })
  @Type(() => AdvertCategoryDto)
  @ValidateNested()
  category!: AdvertCategoryDto

  @ApiProperty({ type: AdvertStatusDto })
  @Type(() => AdvertStatusDto)
  @ValidateNested()
  status!: AdvertStatusDto

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
    enum: AdvertStatusIdEnum,
    enumName: 'AdvertStatusIdEnum',
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
  @IsEnum(AdvertStatusIdEnum, { each: true })
  statusId?: AdvertStatusIdEnum[]
}

export class AdvertStatusCounterItemDto {
  @ApiProperty({
    type: AdvertStatusDto,
  })
  @Type(() => AdvertStatusDto)
  @ValidateNested()
  status!: AdvertStatusDto

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

export class AdvertDetailedDto extends AdvertDto {
  @ApiProperty({
    type: CommonAdvertDto,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((o) => o.commonAdvert !== null)
  @Type(() => CommonAdvertDto)
  @ValidateNested()
  commonAdvert?: CommonAdvertDto
}

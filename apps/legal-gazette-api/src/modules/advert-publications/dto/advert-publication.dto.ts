import { Transform } from 'class-transformer'
import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { Paging, PagingQuery } from '@dmr.is/shared/dto'

import { AdvertVersionEnum } from '../../advert/advert.model'
import { CategoryDto } from '../../category/dto/category.dto'
import { TypeDto } from '../../type/dto/type.dto'

export class AdvertPublicationDto {
  @ApiProperty()
  id!: string

  @ApiProperty()
  advertId!: string

  @ApiProperty()
  scheduledAt!: string

  @ApiProperty({ type: String, nullable: true })
  publishedAt!: string | null

  @ApiProperty({ enum: AdvertVersionEnum, enumName: 'AdvertVersionEnum' })
  version!: AdvertVersionEnum

  @ApiProperty({ type: Boolean })
  isLegacy!: boolean
}

export class UpdateAdvertPublicationDto {
  @ApiProperty({ type: String })
  @IsDateString()
  scheduledAt!: string
}

export class PublishedPublicationDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  advertId!: string

  @ApiProperty({ type: String })
  publishedAt!: string

  @ApiProperty({ type: String })
  title!: string

  @ApiProperty({ type: TypeDto })
  type!: TypeDto

  @ApiProperty({ type: CategoryDto })
  category!: CategoryDto

  @ApiProperty({ enum: AdvertVersionEnum, enumName: 'AdvertVersionEnum' })
  version!: AdvertVersionEnum

  @ApiProperty({ type: String })
  publicationNumber!: string

  @ApiProperty({ type: String })
  createdBy!: string

  @ApiProperty({ type: Boolean })
  isLegacy!: boolean
}

export class GetPublicationsDto {
  @ApiProperty({ type: [PublishedPublicationDto] })
  publications!: PublishedPublicationDto[]

  @ApiProperty({ type: Paging })
  paging!: Paging
}

export class GetRelatedPublicationsDto {
  @ApiProperty({ type: [PublishedPublicationDto] })
  publications!: PublishedPublicationDto[]
}

export class GetPublicationsQueryDto extends PagingQuery {
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsUUID()
  advertId?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  search?: string

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((v) => v.trim())
    }
    return value
  })
  categoryId?: string[]

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsUUID()
  typeId?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsDateString()
  dateFrom?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsDateString()
  dateTo?: string
}

import { Type } from 'class-transformer'
import {
  IsDateString,
  IsString,
  IsUUID,
  ValidateIf,
  ValidateNested,
} from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { DetailedDto } from '@dmr.is/legal-gazette/dto'
import { Paging } from '@dmr.is/shared/dto'

import { AdvertCategoryDto } from '../../advert-category/dto/advert-category.dto'
import { AdvertStatusDto } from '../../advert-status/dto/advert-status.dto'
import { AdvertTypeDto } from '../../advert-type/dto/advert-type.dto'
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

  @ApiProperty({ type: String, nullable: true })
  @IsDateString()
  scheduledAt!: string | null

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

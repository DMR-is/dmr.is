import { IsEnum, IsOptional, IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { BaseEntityDetailedDto, BaseEntityDto } from '@dmr.is/legal-gazette/dto'

import { AdvertTypeSlugEnum } from '../../advert-type/advert-type.model'
import { AdvertTypeDetailedDto } from '../../advert-type/dto/advert-type.dto'

export class GetAdvertCategoriesQueryDto {
  @ApiProperty({
    enum: AdvertTypeSlugEnum,
    enumName: 'CaseTypeSlugEnum',
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsEnum(AdvertTypeSlugEnum)
  type?: AdvertTypeSlugEnum
}

export class AdvertCategoryDto extends BaseEntityDto {}

export class AdvertCategoryDetailedDto extends BaseEntityDetailedDto {
  @ApiProperty({
    type: String,
  })
  @IsUUID()
  typeId!: string

  @ApiProperty({
    type: AdvertTypeDetailedDto,
  })
  type!: AdvertTypeDetailedDto
}

export class GetAdvertCategoriesDto {
  @ApiProperty({
    type: [AdvertCategoryDto],
  })
  categories!: AdvertCategoryDto[]
}

export class GetAdvertCategoriesDetailedDto {
  @ApiProperty({
    type: [AdvertCategoryDetailedDto],
  })
  categories!: AdvertCategoryDetailedDto[]
}

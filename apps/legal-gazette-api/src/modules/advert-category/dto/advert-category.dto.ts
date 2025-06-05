import { IsOptional, IsString } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { BaseEntityDto } from '@dmr.is/legal-gazette/dto'

export class GetAdvertCategoriesQueryDto {
  @ApiProperty({
    type: String,
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsString()
  type?: string
}

export class AdvertCategoryDto extends BaseEntityDto {}

export class GetAdvertCategoriesDto {
  @ApiProperty({
    type: [AdvertCategoryDto],
  })
  categories!: AdvertCategoryDto[]
}

import { Transform } from 'class-transformer'
import { IsBoolean, IsOptional, IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { BaseEntityDto } from '../../../dto/base-entity.dto'

export class GetCategoriesQueryDto {
  @ApiProperty({
    type: String,
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsUUID()
  type?: string

  @ApiProperty({
    type: Boolean,
    required: false,
    description: 'Filter out unassignable advert types',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  excludeUnassignable?: boolean
}

export class CategoryDto extends BaseEntityDto {}

export class GetCategoriesDto {
  @ApiProperty({
    type: [CategoryDto],
  })
  categories!: CategoryDto[]
}

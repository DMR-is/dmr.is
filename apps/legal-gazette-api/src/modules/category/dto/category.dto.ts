import { IsOptional, IsUUID } from 'class-validator'

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
}

export class CategoryDto extends BaseEntityDto {}

export class GetCategoriesDto {
  @ApiProperty({
    type: [CategoryDto],
  })
  categories!: CategoryDto[]
}

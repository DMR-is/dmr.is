import { IsOptional, IsString } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { BaseEntityDto } from '@dmr.is/legal-gazette/dto'

export class GetCategoriesQueryDto {
  @ApiProperty({
    type: String,
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsString()
  type?: string
}

export class CategoryDto extends BaseEntityDto {}

export class GetCategoriesDto {
  @ApiProperty({
    type: [CategoryDto],
  })
  categories!: CategoryDto[]
}

import { IsOptional, IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { CategoryDto } from '../../category/dto/category.dto'

export class TypeWithCategoriesQueryDto {
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsUUID()
  typeId?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string
}

export class TypeWithCategoriesDto {
  @ApiProperty({ type: String })
  @IsUUID()
  id!: string

  @ApiProperty({ type: String })
  title!: string

  @ApiProperty({ type: String })
  slug!: string

  @ApiProperty({ type: [CategoryDto] })
  categories!: CategoryDto[]
}

export class TypeWithCategoriesResponseDto {
  @ApiProperty({ type: TypeWithCategoriesDto })
  type!: TypeWithCategoriesDto
}

export class TypesWithCategoriesResponseDto {
  @ApiProperty({ type: [TypeWithCategoriesDto] })
  types!: TypeWithCategoriesDto[]
}

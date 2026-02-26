import { ApiProperty } from '@nestjs/swagger'

import { ApiOptionalUuid } from '@dmr.is/decorators'

import { TypeWithCategoriesDto } from '../../../models/type-categories.model'

export class TypeWithCategoriesQueryDto {
  @ApiOptionalUuid()
  typeId?: string

  @ApiOptionalUuid()
  categoryId?: string
}

export class TypeWithCategoriesResponseDto {
  @ApiProperty({ type: TypeWithCategoriesDto })
  type!: TypeWithCategoriesDto
}

export class TypesWithCategoriesResponseDto {
  @ApiProperty({ type: [TypeWithCategoriesDto] })
  types!: TypeWithCategoriesDto[]
}

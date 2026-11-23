import { ApiProperty } from '@nestjs/swagger'

import { TypeWithCategoriesDto } from '../../../models/type-categories.dto'

export class TypeWithCategoriesResponseDto {
  @ApiProperty({ type: TypeWithCategoriesDto })
  type!: TypeWithCategoriesDto
}

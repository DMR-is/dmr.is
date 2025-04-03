import { ApiProperty } from '@nestjs/swagger'

import { Category } from './category.dto'

export class GetCategoryResponse {
  @ApiProperty({
    type: Category,
    description: 'Categor',
    required: true,
  })
  readonly category!: Category
}

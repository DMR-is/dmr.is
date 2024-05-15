import { ApiProperty } from '@nestjs/swagger'

import { Category } from './category.dto'

export class GetCategoryResponse {
  @ApiProperty({
    description: 'Categor',
    required: true,
    type: Category,
  })
  readonly category!: Category
}

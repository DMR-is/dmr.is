import { ApiProperty } from '@nestjs/swagger'

import { MainCategory } from './maincategory.dto'

export class GetMainCategoryResponse {
  @ApiProperty({
    description: 'Main category',
    required: true,
    type: MainCategory,
  })
  readonly mainCategory!: MainCategory
}

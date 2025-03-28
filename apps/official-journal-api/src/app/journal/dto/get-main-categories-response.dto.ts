import { ApiProperty } from '@nestjs/swagger'

import { MainCategory } from './main-category.dto'
import { Paging } from '@dmr.is/shared/dto'

export class GetMainCategoriesResponse {
  @ApiProperty({
    description: 'List of main categories',
    required: true,
    isArray: true,
    type: () => MainCategory,
  })
  readonly mainCategories!: Array<MainCategory>

  @ApiProperty({
    description: 'Paging info',
    required: true,
    type: Paging,
  })
  readonly paging!: Paging
}

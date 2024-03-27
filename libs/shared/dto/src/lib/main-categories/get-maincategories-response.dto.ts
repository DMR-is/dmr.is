import { ApiProperty } from '@nestjs/swagger'
import { MainCategory } from './maincategory.dto'
import { Paging } from '../paging/paging.dto'

export class GetMainCategoriesResponse {
  @ApiProperty({
    description: 'List of main categories',
    required: true,
    type: [MainCategory],
  })
  readonly mainCategories!: Array<MainCategory>

  @ApiProperty({
    description: 'Paging info',
    required: true,
    type: Paging,
  })
  readonly paging!: Paging
}

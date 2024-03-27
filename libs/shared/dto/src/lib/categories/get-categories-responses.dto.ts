import { ApiProperty } from '@nestjs/swagger'

import { Paging } from '../paging/paging.dto'
import { Category } from './category.dto'

export class GetCategoriesResponse {
  @ApiProperty({
    description: 'List of advert categories',
    required: true,
    type: [Category],
  })
  readonly categories!: Array<Category>

  @ApiProperty({
    description: 'Paging info',
    required: true,
    type: Paging,
  })
  readonly paging!: Paging
}

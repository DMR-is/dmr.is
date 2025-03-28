import { ApiProperty } from '@nestjs/swagger'

import { Category } from './category.dto'
import { Paging } from '@dmr.is/shared/dto'

export class GetCategoriesResponse {
  @ApiProperty({
    description: 'List of advert categories',
    required: true,
    isArray: true,
    type: () => Category,
  })
  readonly categories!: Category[]

  @ApiProperty({
    description: 'Paging info',
    required: true,
    type: Paging,
  })
  readonly paging!: Paging
}

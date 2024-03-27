import { ApiProperty } from '@nestjs/swagger'
import { Category } from './category.dto'
import { Paging } from '../paging/paging.dto'

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

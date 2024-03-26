import { ApiProperty } from '@nestjs/swagger'
import { JournalAdvertCategory } from './journal-category.dto'
import { Paging } from '../../common'

export class JournalAdvertCategoriesResponse {
  @ApiProperty({
    description: 'List of advert categories',
    required: true,
    type: [JournalAdvertCategory],
  })
  readonly categories!: Array<JournalAdvertCategory>

  @ApiProperty({
    description: 'Paging info',
    required: true,
    type: Paging,
  })
  readonly paging!: Paging
}

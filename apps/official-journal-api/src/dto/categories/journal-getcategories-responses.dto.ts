import { ApiProperty } from '@nestjs/swagger'
import { JournalPaging } from '../journal-paging.dto'
import { JournalAdvertCategory } from './journal-category.dto'

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
    type: JournalPaging,
  })
  readonly paging!: JournalPaging
}

import { ApiProperty } from '@nestjs/swagger'
import { JournalPaging } from '../journal-paging.dto'
import { JournalAdvertMainCategory } from './journal-maincategory.dto'

export class JournalAdvertMainCategoriesResponse {
  @ApiProperty({
    description: 'List of main categories',
    required: true,
    type: [JournalAdvertMainCategory],
  })
  readonly mainCategories!: Array<JournalAdvertMainCategory>

  @ApiProperty({
    description: 'Paging info',
    required: true,
    type: JournalPaging,
  })
  readonly paging!: JournalPaging
}

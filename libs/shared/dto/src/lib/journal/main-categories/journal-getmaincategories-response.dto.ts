import { ApiProperty } from '@nestjs/swagger'
import { JournalAdvertMainCategory } from './journal-maincategory.dto'
import { Paging } from '../../common'

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
    type: Paging,
  })
  readonly paging!: Paging
}

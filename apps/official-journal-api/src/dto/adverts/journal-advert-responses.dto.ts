import { ApiProperty } from '@nestjs/swagger'
import { JournalAdvert } from './journal-advert.dto'
import { JournalPaging } from '../journal-paging.dto'

export class JournalAdvertsResponse {
  @ApiProperty({
    description: 'List of adverts',
    required: true,
    type: [JournalAdvert],
  })
  readonly adverts!: Array<JournalAdvert>

  @ApiProperty({
    description: 'Paging info',
    required: true,
    type: JournalPaging,
  })
  readonly paging!: JournalPaging
}

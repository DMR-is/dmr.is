import { ApiProperty } from '@nestjs/swagger'
import { JournalPaging } from '../journal-paging.dto'
import { JournalAdvertType } from './journal-advert-type.dto'

export class JournalAdvertTypesResponse {
  @ApiProperty({
    description: 'List of advert types',
    required: true,
    type: [JournalAdvertType],
  })
  readonly types!: Array<JournalAdvertType>

  @ApiProperty({
    description: 'Paging info',
    required: true,
  })
  readonly paging!: JournalPaging
}

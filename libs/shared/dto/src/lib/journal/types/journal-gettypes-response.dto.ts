import { ApiProperty } from '@nestjs/swagger'
import { JournalAdvertType } from './journal-advert-type.dto'
import { Paging } from '../../common'

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
    type: Paging,
  })
  readonly paging!: Paging
}

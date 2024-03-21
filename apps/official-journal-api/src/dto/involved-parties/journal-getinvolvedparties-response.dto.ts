import { ApiProperty } from '@nestjs/swagger'
import { JournalPaging } from '../journal-paging.dto'
import { JournalAdvertInvolvedParty } from './journal-involvedparty.dto'

export class JournalAdvertInvolvedPartiesResponse {
  @ApiProperty({
    description: 'List of involved parties',
    required: true,
    type: [JournalAdvertInvolvedParty],
  })
  readonly involvedParties!: Array<JournalAdvertInvolvedParty>

  @ApiProperty({
    description: 'Paging info',
    required: true,
    type: JournalPaging,
  })
  readonly paging!: JournalPaging
}

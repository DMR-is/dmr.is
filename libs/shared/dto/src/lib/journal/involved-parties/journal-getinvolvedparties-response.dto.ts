import { ApiProperty } from '@nestjs/swagger'
import { JournalAdvertInvolvedParty } from './journal-involvedparty.dto'
import { Paging } from '../../common'

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
    type: Paging,
  })
  readonly paging!: Paging
}

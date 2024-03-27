import { ApiProperty } from '@nestjs/swagger'
import { InvolvedParty } from './involvedparty.dto'
import { Paging } from '../paging/paging.dto'

export class GetInvolvedPartiesResponse {
  @ApiProperty({
    description: 'List of involved parties',
    required: true,
    type: [InvolvedParty],
  })
  readonly involvedParties!: Array<InvolvedParty>

  @ApiProperty({
    description: 'Paging info',
    required: true,
    type: Paging,
  })
  readonly paging!: Paging
}

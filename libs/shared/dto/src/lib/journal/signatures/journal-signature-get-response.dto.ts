import { ApiProperty } from '@nestjs/swagger'
import { JournalSignature } from './journal-signature.dto'
import { Paging } from '../../common'

export class JournalSignatureGetResponse {
  @ApiProperty({
    type: [JournalSignature],
    description: 'List of signatures',
    required: true,
    nullable: false,
  })
  items!: JournalSignature[]

  @ApiProperty({
    type: Paging,
    description: 'Paging information',
    required: true,
    nullable: false,
  })
  paging!: Paging
}

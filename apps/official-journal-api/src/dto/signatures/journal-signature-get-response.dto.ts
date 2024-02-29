import { ApiProperty } from '@nestjs/swagger'
import { JournalPaging } from '../journal-paging.dto'
import { JournalSignature } from './journal-signature.dto'

export class JournalSignatureGetResponse {
  @ApiProperty({
    type: [JournalSignature],
    description: 'List of signatures',
    required: true,
    nullable: false,
  })
  items!: JournalSignature[]

  @ApiProperty({
    type: JournalPaging,
    description: 'Paging information',
    required: true,
    nullable: false,
  })
  paging!: JournalPaging
}

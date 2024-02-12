import { ApiProperty } from '@nestjs/swagger'
import { JournalPaging } from '../journal-paging.dto'
import { JournalSignature } from './journal-signature.dto'

export class JournalSignaturesResponse {
  @ApiProperty({
    description: 'List of signatures',
    required: true,
    type: [JournalSignature],
  })
  readonly signatures!: JournalSignature[]

  @ApiProperty({
    description: 'Paging info',
    required: true,
    type: JournalPaging,
  })
  readonly paging!: JournalPaging
}

import { ApiProperty } from '@nestjs/swagger'
import { JournalSignature } from './journal-signature.dto'

export class JournalPostSignatureResponse {
  @ApiProperty({
    required: true,
    type: JournalSignature,
  })
  signature!: JournalSignature
}

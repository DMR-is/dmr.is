import { ApiProperty } from '@nestjs/swagger'
import { JournalSignatureMemberDetailed } from '../models/journal-signature-member-detailed.dto'

export class JournalPostSignatureRegularBody {
  @ApiProperty({
    description: 'The institution that the signature is for.',
    example: 'Borgarstjórn Reykjavíkur',
    required: true,
    type: String,
  })
  institution!: string

  @ApiProperty({
    description:
      'Date the advert was signed. ISO 8601 date and time format in UTC.',
    example: '2024-01-01T09:00:00Z',
    required: true,
    type: String,
  })
  readonly date!: string

  @ApiProperty({
    description: 'Members of the committee that signed the advert.',
    example: [
      {
        name: 'Anna Tryggvadóttir',
        textBlow: 'formaður',
      },
      {
        name: 'Páll Halldórsson',
        textBlow: 'skrifstofustjóri',
      },
    ],
    type: [JournalSignatureMemberDetailed],
  })
  members!: JournalSignatureMemberDetailed[]
}

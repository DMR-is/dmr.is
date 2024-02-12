import { ApiProperty } from '@nestjs/swagger'

import { JournalSignatureMember } from './journal-signature-member.dto'
import { JournalSignatureMemberDetailed } from './journal-signature-member-detailed.dto'

export class JournalSignatureRegular {
  @ApiProperty({
    description: 'Unique ID for the signature, GUID format.',
    example: '00000000-0000-0000-0000-000000000000',
    required: true,
    nullable: false,
    type: String,
  })
  id!: string

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

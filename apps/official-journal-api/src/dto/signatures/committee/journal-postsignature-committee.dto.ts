import { ApiProperty } from '@nestjs/swagger'

import { JournalSignatureMemberDetailed } from '../models/journal-signature-member-detailed.dto'
import { JournalSignatureMember } from '../models/journal-signature-member.dto'

export class JournalPostSignatureCommitteeBody {
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
    description: 'Chairman of the committee that signed the advert.',
    required: true,
    example: {
      name: 'Dagur B. Eggertsson',
      textBelow: 'borgarstjóri',
    },
    type: JournalSignatureMemberDetailed,
  })
  chairman!: JournalSignatureMemberDetailed

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
    type: JournalSignatureMember,
  })
  memebers!: JournalSignatureMember[]
}

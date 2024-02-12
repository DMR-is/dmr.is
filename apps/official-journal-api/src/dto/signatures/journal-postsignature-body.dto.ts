import { ApiProperty } from '@nestjs/swagger'
import { JournalSignatureType } from '../journal-constants.dto'
import { IsEnum, IsNotEmpty } from 'class-validator'
import { JournalPostSignatureRegularBody } from './journal-postsignature-regular-body.dto'
import { JournalPostSignatureCommitteeBody } from './journal-postsignature-committee.dto'

type Signature =
  | Array<JournalPostSignatureRegularBody>
  | JournalPostSignatureCommitteeBody

export class JournalPostSignatureBody {
  @ApiProperty({
    enum: JournalSignatureType,
    required: true,
    example: JournalSignatureType.Committee,
  })
  @IsEnum(JournalSignatureType)
  @IsNotEmpty()
  type!: JournalSignatureType

  @ApiProperty({
    type: String,
    required: false,
    example: 'Guðrún Óskarsdóttir',
  })
  additionalSignature!: string | null

  @ApiProperty({
    required: true,
    oneOf: [
      { type: 'array', items: { type: 'JournalPostSignatureRegularBody' } },
      { type: 'JournalPostSignatureCommitteeBody' },
    ],
  })
  signature!: Signature
}

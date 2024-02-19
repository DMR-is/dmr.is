import { ApiProperty, getSchemaPath } from '@nestjs/swagger'
import { JournalSignatureType } from '../journal-constants.dto'
import { IsEnum, IsNotEmpty, Length } from 'class-validator'
import { JournalPostSignatureRegularBody } from './regular/journal-postsignature-regular-body.dto'
import { JournalPostSignatureCommitteeBody } from './committee/journal-postsignature-committee.dto'

type Signature =
  | Array<JournalPostSignatureRegularBody>
  | JournalPostSignatureCommitteeBody

export class JournalPostSignatureBody {
  @ApiProperty({
    type: String,
    required: true,
    example: '0000000-0000-0000-0000-000000000000',
  })
  @Length(36, 36) // hypenated UUID
  advertId!: JournalSignatureType

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
      { $ref: getSchemaPath(JournalPostSignatureRegularBody) },
      { $ref: getSchemaPath(JournalPostSignatureCommitteeBody) },
    ],
  })
  signature!: Signature
}

import { ApiProperty, getSchemaPath } from '@nestjs/swagger'
import { JournalSignatureType } from '../journal-constants.dto'
import { IsEnum, IsNotEmpty, Length } from 'class-validator'
import { JournalSignatureCommittee } from './committee/journal-signature-committee.dto'
import { JournalSignatureRegular } from './regular/journal-signature-regular.dto'

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
    description: 'Signature data',
    oneOf: [
      { $ref: getSchemaPath(JournalSignatureCommittee) },
      { $ref: getSchemaPath(JournalSignatureRegular) },
    ],
  })
  signature!: JournalSignatureCommittee | JournalSignatureRegular
}

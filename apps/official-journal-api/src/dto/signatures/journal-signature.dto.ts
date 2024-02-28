import { ApiProperty, getSchemaPath } from '@nestjs/swagger'
import { JournalSignatureType } from '../journal-constants.dto'
import { JournalSignatureCommittee } from './committee/journal-signature-committee.dto'
import { JournalSignatureRegular } from './regular/journal-signature-regular.dto'

export class JournalSignature {
  @ApiProperty({
    description: 'Unique ID for the signature, GUID format.',
    example: '00000000-0000-0000-0000-000000000000',
    required: true,
    nullable: false,
    type: String,
  })
  id!: string

  @ApiProperty({
    description: 'Type of the signature',
    enum: JournalSignatureType,
    example: JournalSignatureType.Regular,
    type: JournalSignatureType,
  })
  type!: string

  @ApiProperty({
    description: 'Optional addiational signature',
    example: 'Guðrún Jónsdóttir',
    required: false,
    type: String,
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

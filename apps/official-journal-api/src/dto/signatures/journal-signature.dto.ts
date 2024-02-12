import { ApiProperty, refs } from '@nestjs/swagger'
import { JournalSignatureType } from '../journal-constants.dto'
import { JournalSignatureCommittee } from './journal-signature-committee.dto'
import { JournalSignatureRegular } from './journal-signature-regular.dto'

type Signature = JournalSignatureCommittee | JournalSignatureRegular[]

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
    description: 'Optional addiation signature',
    example: 'Guðrún Jónsdóttir',
    required: false,
    type: String,
  })
  additionalSignature!: string | null

  @ApiProperty({
    description: 'The institution that the signature is for.',
    example: 'Borgarstjórn Reykjavíkur',
    required: true,
    oneOf: [
      { type: 'JournalSignatureCommittee' },
      { type: 'array', items: { type: 'JournalSignatureRegular' } },
    ],
  })
  signature!: Signature
}

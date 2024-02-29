import { ApiProperty } from '@nestjs/swagger'
import { JournalSignatureType } from '../journal-constants.dto'
import { JournalSignatureMember } from './journal-signature-member.dto'
import { IsArray, ArrayMinSize } from 'class-validator'

class JournalSignatureData {
  @ApiProperty({
    description: 'Institution of the signature',
    example: 'Reykjavíkurborg',
    required: true,
    type: String,
  })
  institution!: string

  @ApiProperty({
    description: 'Date of the signature',
    type: String,
    example: '2006-10-17 00:00:00.0000',
    required: true,
    nullable: false,
  })
  readonly date!: string

  @ApiProperty({
    description: 'Members of the signature',
    example: true,
    required: true,
    nullable: false,
    type: [JournalSignatureMember],
  })
  members!: JournalSignatureMember[]
}

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
    description: 'Advert ID',
    example: '00000000-0000-0000-0000-000000000000',
    required: true,
    type: String,
  })
  advertId!: string

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
  additional!: string | null

  @ApiProperty({
    description: 'Signature data',
    example: true,
    required: true,
    nullable: false,
    type: [JournalSignatureData], // leaving this as array for the time being, we might decide to use a discriminator later
  })
  @IsArray()
  @ArrayMinSize(1)
  // could set max size of type is committee -> @ValidateIf
  data!: JournalSignatureData[]
}

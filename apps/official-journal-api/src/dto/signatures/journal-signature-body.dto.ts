import { ApiProperty } from '@nestjs/swagger'
import { JournalSignatureType } from '../journal-constants.dto'
import { ArrayMinSize, IsArray } from 'class-validator'
import { JournalSignatureData } from './journal-signature.dto'

export class JournalSignatureBody {
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

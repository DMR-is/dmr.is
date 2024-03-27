import { ApiProperty } from '@nestjs/swagger'

import { IsArray, ArrayMinSize } from 'class-validator'
import { AdvertSignatureType } from './advert-signature-constants.dto'
import { AdvertSignatureMember } from './advert-signature-member.dto'

export class AdvertSignatureData {
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
    type: [AdvertSignatureMember],
  })
  members!: AdvertSignatureMember[]
}

export class AdvertSignature {
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
    enum: AdvertSignatureType,
    example: AdvertSignatureType.Regular,
    type: AdvertSignatureType,
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
    type: [AdvertSignatureData], // leaving this as array for the time being, we might decide to use a discriminator later
  })
  @IsArray()
  @ArrayMinSize(1)
  // could set max size of type is committee -> @ValidateIf
  data!: AdvertSignatureData[]
}

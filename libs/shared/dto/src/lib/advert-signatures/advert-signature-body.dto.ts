import { ArrayMinSize, IsArray } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { AdvertSignatureData } from './advert-signature.dto'
import { AdvertSignatureType } from './advert-signature-constants.dto'

export class AdvertSignatureBody {
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

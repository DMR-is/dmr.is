import { ApiProperty } from '@nestjs/swagger'

import { Paging } from '../paging/paging.dto'
import { AdvertSignature } from './advert-signature.dto'

export class GetAdvertSignatureResponse {
  @ApiProperty({
    type: [AdvertSignature],
    description: 'List of signatures',
    required: true,
    nullable: false,
  })
  items!: AdvertSignature[]

  @ApiProperty({
    type: Paging,
    description: 'Paging information',
    required: true,
    nullable: false,
  })
  paging!: Paging
}

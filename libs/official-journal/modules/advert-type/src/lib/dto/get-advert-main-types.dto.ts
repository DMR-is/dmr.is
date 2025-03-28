import { ApiProperty } from '@nestjs/swagger'

import { AdvertMainType } from './advert-main-type.dto'
import { Paging } from '@dmr.is/shared/dto'

export class GetAdvertMainTypes {
  @ApiProperty({
    type: [AdvertMainType],
    description: 'List of all main advert types',
  })
  mainTypes!: AdvertMainType[]

  @ApiProperty({
    type: Paging,
    description: 'Paging information',
  })
  paging!: Paging
}

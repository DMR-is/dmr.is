import { AdvertMainType } from '@dmr.is/official-journal/dto/advert-type/advert-type.dto'
import { Paging } from '@dmr.is/shared/dto'

import { ApiProperty } from '@nestjs/swagger'

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

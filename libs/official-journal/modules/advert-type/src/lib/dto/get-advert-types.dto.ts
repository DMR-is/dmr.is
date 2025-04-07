import { AdvertType } from '@dmr.is/official-journal/dto/advert-type/advert-type.dto'
import { Paging } from '@dmr.is/shared/dto'

import { ApiProperty } from '@nestjs/swagger'

export class GetAdvertTypes {
  @ApiProperty({
    type: [AdvertType],
    description: 'List of advert types',
  })
  types!: AdvertType[]

  @ApiProperty({
    type: Paging,
    description: 'Paging information',
  })
  paging!: Paging
}

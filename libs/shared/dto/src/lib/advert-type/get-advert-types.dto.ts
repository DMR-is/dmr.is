import { Paging } from '@dmr.is/shared/dto'

import { ApiProperty } from '@nestjs/swagger'

import { AdvertType } from './advert-type.dto'

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

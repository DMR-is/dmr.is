import { ApiProperty } from '@nestjs/swagger'

import { Paging } from '../paging/paging.dto'
import { AdvertType } from './advert-type.dto'

export class GetAdvertTypesResponse {
  @ApiProperty({
    description: 'List of advert types',
    required: true,
    type: [AdvertType],
  })
  readonly types!: Array<AdvertType>

  @ApiProperty({
    description: 'Paging info',
    required: true,
    type: Paging,
  })
  readonly paging!: Paging
}

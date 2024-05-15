import { ApiProperty } from '@nestjs/swagger'

import { AdvertType } from './advert-type.dto'

export class GetAdvertTypeResponse {
  @ApiProperty({
    description: 'Advert type',
    required: true,
    type: AdvertType,
  })
  readonly type!: AdvertType
}

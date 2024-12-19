import { ApiProperty } from '@nestjs/swagger'

import { AdvertType } from './advert-type.dto'

export class GetAdvertType {
  @ApiProperty({
    type: AdvertType,
    description: 'The advert type',
  })
  type!: AdvertType
}

import { ApiProperty } from '@nestjs/swagger'

import { AdvertMainType } from './advert-main-type.dto'

export class GetAdvertMainType {
  @ApiProperty({
    type: AdvertMainType,
    description: 'The main advert type',
  })
  mainType!: AdvertMainType
}

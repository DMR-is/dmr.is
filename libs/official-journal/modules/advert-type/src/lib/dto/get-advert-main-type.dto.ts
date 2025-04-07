import { AdvertMainType } from '@dmr.is/official-journal/dto/advert-type/advert-type.dto'

import { ApiProperty } from '@nestjs/swagger'

export class GetAdvertMainType {
  @ApiProperty({
    type: AdvertMainType,
    description: 'The main advert type',
  })
  mainType!: AdvertMainType
}

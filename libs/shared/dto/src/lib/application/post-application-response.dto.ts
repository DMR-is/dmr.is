import { ApiProperty } from '@nestjs/swagger'
import { Advert } from '../adverts/advert.dto'

export class PostApplicationResponse {
  @ApiProperty({
    type: Advert,
    required: true,
    description: 'Return the submitted application',
  })
  advert!: Advert
}

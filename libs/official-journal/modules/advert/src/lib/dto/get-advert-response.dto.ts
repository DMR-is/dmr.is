import { ApiProperty, ApiResponse } from '@nestjs/swagger'

import { Advert } from './advert.dto'
import { AdvertNotFound } from './get-adverts-responses.dto'

@ApiResponse({
  status: 404,
  description: 'Advert not found',
  type: AdvertNotFound,
})
export class GetAdvertResponse {
  @ApiProperty({
    description: 'Advert',
    required: true,
    type: Advert,
  })
  readonly advert!: Advert
}

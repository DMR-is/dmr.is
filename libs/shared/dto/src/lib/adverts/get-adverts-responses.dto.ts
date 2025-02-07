import { HttpStatus } from '@nestjs/common'
import { ApiProperty, ApiResponse } from '@nestjs/swagger'

import { Paging } from '../paging/paging.dto'
import { Advert } from './advert.dto'
import { AdvertSimilar } from './advert-similar.dto'

@ApiResponse({
  status: 404,
  description: 'Advert not found',
  type: AdvertNotFound,
})
export class AdvertNotFound {
  @ApiProperty({
    description: 'HTTP status code of response',
    required: true,
    type: Number,
  })
  statusCode!: HttpStatus

  @ApiProperty({
    description: 'Response message',
    required: true,
    type: String,
  })
  message!: string
  error?: string
}

export class GetAdvertsResponse {
  @ApiProperty({
    description: 'List of adverts',
    required: true,
    type: [Advert],
  })
  readonly adverts!: Array<Advert>

  @ApiProperty({
    description: 'Paging info',
    required: true,
    type: Paging,
  })
  readonly paging!: Paging
}

export class GetSimilarAdvertsResponse {
  @ApiProperty({
    description: 'List of similar adverts',
    required: true,
    type: [AdvertSimilar],
  })
  readonly adverts!: Array<AdvertSimilar>
}

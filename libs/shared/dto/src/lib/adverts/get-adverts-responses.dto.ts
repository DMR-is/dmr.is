import { ApiProperty, ApiResponse } from '@nestjs/swagger'
import { Advert } from './advert.dto'
import { HttpStatus } from '@nestjs/common'
import { Paging } from '../paging/paging.dto'

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

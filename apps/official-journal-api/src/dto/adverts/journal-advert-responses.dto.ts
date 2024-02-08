import { ApiProperty, ApiResponse } from '@nestjs/swagger'
import { JournalAdvert } from './journal-advert.dto'
import { JournalPaging } from '../journal-paging.dto'
import { HttpStatus } from '@nestjs/common'

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

export class JournalAdvertsResponse {
  @ApiProperty({
    description: 'List of adverts',
    required: true,
    type: [JournalAdvert],
  })
  readonly adverts!: Array<JournalAdvert>

  @ApiProperty({
    description: 'Paging info',
    required: true,
    type: JournalPaging,
  })
  readonly paging!: JournalPaging
}

export class JournalAdvertsValidationResponse {
  @ApiProperty({
    description: 'Array of error messages',
    required: true,
    type: [String],
    example: ['message must be shorter than or equal to 10 characters'],
  })
  message!: Array<string>

  @ApiProperty({
    description: 'Error type',
    required: false,
    type: String,
    example: 'Bad Request',
  })
  error?: string

  @ApiProperty({
    description: 'HTTP status code of response',
    required: true,
    type: Number,
    example: 400,
  })
  statusCode!: HttpStatus
}

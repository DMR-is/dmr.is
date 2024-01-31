import { ApiProperty, ApiResponse } from '@nestjs/swagger'
import { JournalAdvert } from './journal-advert.dto'
import { JournalPaging } from './journal-paging.dto'
import { HttpStatus } from '@nestjs/common'
import { JournalAdvertValidationStatus } from './journal-constants.dto'
import { JournalAdvertValidationError } from './journal-validation'

@ApiResponse({
  status: 404,
  description: 'Advert not found',
  type: AdvertNotFound,
})
export class AdvertNotFound {
  @ApiProperty({
    description: 'HTTP status code of response',
    required: true,
  })
  statusCode!: HttpStatus

  @ApiProperty({
    description: 'Response message',
    required: true,
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
  })
  readonly paging!: JournalPaging
}

export class JournalAdvertValidationResponse {
  @ApiProperty({
    description: 'Validation status',
    required: true,
    enum: JournalAdvertValidationStatus,
    example: JournalAdvertValidationStatus.Invalid,
  })
  readonly status!: JournalAdvertValidationStatus

  @ApiProperty({
    description: 'Validation errors',
    required: false,
    type: [JournalAdvertValidationError],
  })
  readonly errors?: Array<JournalAdvertValidationError>
}

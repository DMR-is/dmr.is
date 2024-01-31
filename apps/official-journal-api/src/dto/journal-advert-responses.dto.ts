import { ApiProperty, ApiResponse } from '@nestjs/swagger'
import { JournalAdvert } from './journal-advert.dto'
import { JournalPaging } from './journal-paging.dto'
import { HttpStatus } from '@nestjs/common'
import { JournalResponseStatus } from './journal-constants.dto'
import { JournalError } from './journal-error'

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

export class JournalValidateSuccessResponse {
  @ApiProperty({
    description: 'Status is always success',
    required: true,
    enum: JournalResponseStatus,
    example: JournalResponseStatus.Success,
  })
  readonly status!: JournalResponseStatus.Success
}

export class JournalValidateErrorResponse {
  @ApiProperty({
    description: 'Status is always error',
    required: true,
    enum: JournalResponseStatus,
    example: JournalResponseStatus.Error,
  })
  readonly status!: JournalResponseStatus.Error

  @ApiProperty({
    description: 'Array of errors',
    required: true,
    type: [JournalError],
  })
  readonly errors!: Array<JournalError>
}

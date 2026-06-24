import { ApiProperty } from '@nestjs/swagger'

export enum ApiErrorName {
  NotFound = 'NotFound',
  ValidationError = 'ValidationError',
  ForeignKeyConstraintError = 'ForeignKeyConstraintError',
  UniqueConstraintError = 'UniqueConstraintError',
  TimeoutError = 'TimeoutError',
  Unauthorized = 'Unauthorized',
  Forbidden = 'Forbidden',
  BadRequest = 'BadRequest',
  InternalServerError = 'InternalServerError',
  ConnectionAcquireTimeoutError = 'ConnectionAcquireTimeoutError',
  UnknownError = 'UnknownError',
}

export class ApiErrorDto {
  @ApiProperty({
    type: Number,
  })
  statusCode!: number

  @ApiProperty({
    type: String,
  })
  timestamp!: string

  @ApiProperty({
    enum: ApiErrorName,
    example: Object.values(ApiErrorName),
    required: false,
  })
  name?: string

  @ApiProperty({
    type: String,
    required: false,
  })
  message?: string

  @ApiProperty({
    type: String,
    required: false,
    description:
      'User-facing, localized message safe to display directly in the client. Absent when the error has no curated translation.',
  })
  translatedMessage?: string

  @ApiProperty({
    type: [String],
    required: false,
  })
  details?: string[]
}

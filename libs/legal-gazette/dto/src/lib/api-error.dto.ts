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
  UnknownError = 'UnknownError',
}

export class ApiErrorDto {
  @ApiProperty({
    type: Number,
    description: 'HTTP status code',
  })
  statusCode!: number

  @ApiProperty({
    type: String,
    description: 'Timestamp of the error',
  })
  timestamp!: string

  @ApiProperty({
    enum: ApiErrorName,
    description: 'Error name',
    required: false,
  })
  name?: string

  @ApiProperty({
    type: String,
    description: 'Error message',
    required: false,
  })
  message?: string

  @ApiProperty({
    type: String,
    description: 'Additional details',
    required: false,
  })
  details?: string
}

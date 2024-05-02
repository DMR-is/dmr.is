import { ApiProperty } from '@nestjs/swagger'

export class JournalError {
  @ApiProperty({
    description: 'Field name / path to the property',
    required: true,
    example: 'advert.title',
  })
  readonly path!: string

  @ApiProperty({
    description: 'Message describing the error',
    required: true,
    example: 'Advert title must be atleast 10 characters long',
  })
  readonly message!: string
}

export class JournalValidationError {
  @ApiProperty({
    description: 'Field name',
    required: true,
    example: 'page',
  })
  readonly field!: string

  @ApiProperty({
    description: 'Message describing the error',
    required: true,
    type: [String],
    example: [
      'page must be a positive number',
      'page must be an integer number',
    ],
  })
  readonly errors!: string[]
}

export class JournalAdvertErrorResponse {
  @ApiProperty({
    description: 'HTTP status code of response',
    required: true,
    type: Number,
  })
  statusCode!: number

  @ApiProperty({
    description: 'Error response message',
    required: true,
    type: String,
  })
  error!: string

  @ApiProperty({
    description: 'Detail error message',
    required: false,
    type: String,
  })
  message?: string

  @ApiProperty({
    description: 'Possible validation errors',
    required: false,
    type: [JournalValidationError],
  })
  validationErrors?: JournalValidationError[]
}

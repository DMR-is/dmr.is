import { ApiProperty } from '@nestjs/swagger'
import { HttpStatus } from '@nestjs/common'

export class ValidationResponse {
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

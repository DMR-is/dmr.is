import { ApiProperty } from '@nestjs/swagger'

export class JournalAdvertValidationError {
  @ApiProperty({
    description: 'Field name / name of the property',
    required: true,
    example: 'Subject',
  })
  readonly field!: string

  @ApiProperty({
    description: 'Reason for the validation error',
    required: true,
    example: 'Subject is required',
  })
  readonly reason!: string
}

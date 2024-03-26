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

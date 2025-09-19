import { ApiProperty } from '@nestjs/swagger'

export class PostApplicationComment {
  @ApiProperty({
    type: String,
    description: 'The case comment itself',
    required: true,
  })
  comment!: string

  @ApiProperty({
    type: String,
    required: false,
    description: 'Name of the user making the application comment.',
  })
  applicationUserName?: string
}

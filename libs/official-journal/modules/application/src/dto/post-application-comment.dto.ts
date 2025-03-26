import { ApiProperty } from '@nestjs/swagger'

export class PostApplicationComment {
  @ApiProperty({
    type: String,
    description: 'The case comment itself',
    required: true,
  })
  comment!: string
}

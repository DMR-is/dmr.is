import { ApiProperty } from '@nestjs/swagger'

export class PostApplicationComment {
  @ApiProperty({
    type: String,
    description: 'Reykjavíkurborg',
    required: true,
  })
  from!: string

  @ApiProperty({
    type: String,
    description: 'Addtional name for the comment, goes after `from` text.',
    example: 'Reykjavíkurborg, (`Jón Jónsson`)',
    required: false,
  })
  name?: string

  @ApiProperty({
    type: String,
    description: 'The case comment itself',
    required: true,
  })
  comment!: string
}

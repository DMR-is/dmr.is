import { ApiProperty } from '@nestjs/swagger'

export class CaseCommentType {
  @ApiProperty({
    type: String,
    description: 'The title of the case comment type',
  })
  readonly id!: string

  @ApiProperty({
    type: String,
    description: 'The title of the case comment type',
  })
  title!: string

  @ApiProperty({
    type: String,
    description: 'The slug of the case comment type',
  })
  slug!: string
}

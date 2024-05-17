import { ApiProperty } from '@nestjs/swagger'

import { CaseCommentType } from './case-comment-constants'

export class PostCaseComment {
  @ApiProperty({
    type: Boolean,
    description: 'Is the comment internal',
    required: true,
  })
  internal!: boolean

  @ApiProperty({
    enum: CaseCommentType,
    description: 'Type of the comment',
    required: true,
  })
  type!: CaseCommentType

  @ApiProperty({
    type: String,
    description: 'The case comment itself',
    required: true,
  })
  comment!: string | null

  @ApiProperty({
    type: String,
    description: 'Id of the user who created the comment',
    required: true,
  })
  from!: string

  @ApiProperty({
    type: String,
    description: 'To whom or what the task is assigned to.',
    required: false,
  })
  to!: string | null
}

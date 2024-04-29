import { ApiProperty } from '@nestjs/swagger'

import { CaseCommentTitle, CaseCommentType } from './case-comment-constants'

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
  comment!: string

  @ApiProperty({
    type: String,
    description: 'The task itself',
    required: true,
  })
  from!: string | null

  @ApiProperty({
    type: String,
    description: 'To whom or what the task is assigned to.',
    required: false,
  })
  to!: string | null
}

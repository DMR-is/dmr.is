import { ApiProperty } from '@nestjs/swagger'

import { CaseComment } from './case-comment.dto'

export class PostCaseCommentResponse {
  @ApiProperty({
    description: 'The created case comment',
    required: true,
    type: CaseComment,
  })
  readonly comment!: CaseComment
}

import { ApiProperty } from '@nestjs/swagger'

import { CaseComment } from './case-comment.dto'

export class GetCaseCommentResponse {
  @ApiProperty({
    description: 'The comment that was found or null.',
    required: true,
    type: CaseComment,
  })
  readonly comment!: CaseComment | null
}

import { ApiProperty } from '@nestjs/swagger'

import { CaseComment } from './case-comment.dto'

export class GetCaseCommentsResponse {
  @ApiProperty({
    description: 'List of case comments.',
    required: true,
    type: [CaseComment],
  })
  readonly comments!: Array<CaseComment>
}

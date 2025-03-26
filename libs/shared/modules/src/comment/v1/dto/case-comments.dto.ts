import { ApiProperty } from '@nestjs/swagger'

import { CaseComment } from './case-comment.dto'

export class CaseComments {
  @ApiProperty({
    type: CaseComment,
    required: true,
  })
  caseComment!: CaseComment

  // TODO: add case?
}

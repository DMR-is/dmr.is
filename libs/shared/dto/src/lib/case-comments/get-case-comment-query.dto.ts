import { ApiProperty } from '@nestjs/swagger'

enum CaseCommentType {
  Internal = 'internal',
  External = 'external',
  All = 'all',
}
export class GetCaseCommentsQuery {
  @ApiProperty({
    enum: CaseCommentType,
    description: 'Type of the comment',
    required: false,
  })
  type?: CaseCommentType
}

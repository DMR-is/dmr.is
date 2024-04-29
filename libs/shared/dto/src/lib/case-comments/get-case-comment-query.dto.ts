import { ApiProperty } from '@nestjs/swagger'

export enum CaseCommentPublicity {
  Internal = 'internal',
  External = 'external',
  All = 'all',
}
export class GetCaseCommentsQuery {
  @ApiProperty({
    enum: CaseCommentPublicity,
    description: 'Type of the comment',
    required: false,
  })
  type?: CaseCommentPublicity
}

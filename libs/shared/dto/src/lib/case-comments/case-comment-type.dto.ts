import { ApiProperty } from '@nestjs/swagger'

import { CaseCommentTypeEnum } from './case-comment-constants'

export class CaseCommentType {
  @ApiProperty({
    type: String,
    description: 'The title of the case comment type',
  })
  readonly id!: string

  @ApiProperty({
    enum: CaseCommentTypeEnum,
    description: 'The title of the case comment type',
  })
  title!: CaseCommentTypeEnum

  @ApiProperty({
    type: String,
    description: 'The slug of the case comment type',
  })
  slug!: string
}

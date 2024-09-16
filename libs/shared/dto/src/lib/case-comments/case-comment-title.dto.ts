import { ApiProperty } from '@nestjs/swagger'

import { CaseCommentTitleEnum } from './case-comment-constants'

export class CaseCommentTitle {
  @ApiProperty({
    type: String,
    description: 'The title of the case comment type',
  })
  readonly id!: string

  @ApiProperty({
    enum: CaseCommentTitleEnum,
    description: 'The title of the case comment type',
  })
  title!: CaseCommentTitleEnum

  @ApiProperty({
    type: String,
    description: 'The slug of the case comment type',
  })
  slug!: string
}

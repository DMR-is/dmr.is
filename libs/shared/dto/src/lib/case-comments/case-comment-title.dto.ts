import { ApiProperty } from '@nestjs/swagger'

import { CaseCommentTypeTitleEnum } from './case-comment-constants'

export class CaseCommentTitle {
  @ApiProperty({
    type: String,
    description: 'The title of the case comment type',
  })
  readonly id!: string

  @ApiProperty({
    enum: CaseCommentTypeTitleEnum,
    description: 'The title of the case comment type',
  })
  title!: CaseCommentTypeTitleEnum

  @ApiProperty({
    type: String,
    description: 'The slug of the case comment type',
  })
  slug!: string
}

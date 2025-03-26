import { Transform } from 'class-transformer'

import { ApiProperty } from '@nestjs/swagger'

export class GetCaseCommentsQuery {
  /**
   * Type of comments to return comment.
   * If provided with value of true it will return `internal` comments.
   * If provided with value of false it will return `external` comments.
   * If left undefined, it will return `all` comments.
   * @type {boolean}
   * @default undefined
   */
  @ApiProperty({
    enum: Boolean,
    description: 'Type of the comment',
    required: false,
  })
  @Transform(({ value }) => {
    if (value === 'true') {
      return true
    }
    if (value === 'false') {
      return false
    }
    return undefined
  })
  internal?: boolean
}

import { Transform } from 'class-transformer'

import { ApiProperty } from '@nestjs/swagger'

export class GetCaseCommentsQuery {
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

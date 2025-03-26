import { ApiProperty } from '@nestjs/swagger'

import { CaseTag } from './tag.dto'

export class GetTagsResponse {
  @ApiProperty({
    description: 'List of advert categories',
    required: true,
    type: [CaseTag],
  })
  readonly tags!: Array<CaseTag>
}

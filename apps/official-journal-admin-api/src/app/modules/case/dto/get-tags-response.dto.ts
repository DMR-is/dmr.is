import { CaseTag } from '@dmr.is/official-journal/dto/case-tag/case-tag.dto'

import { ApiProperty } from '@nestjs/swagger'

export class GetTagsResponse {
  @ApiProperty({
    description: 'List of advert categories',
    required: true,
    type: [CaseTag],
  })
  readonly tags!: Array<CaseTag>
}

import { ApiProperty } from '@nestjs/swagger'

import { Paging } from '@dmr.is/shared/dto'
import { Institution } from '@dmr.is/official-journal/dto'

export class GetInstitutionsResponse {
  @ApiProperty({
    description: 'List of involved parties',
    required: true,
    type: [Institution],
  })
  readonly institutions!: Array<Institution>

  @ApiProperty({
    description: 'Paging info',
    required: true,
    type: Paging,
  })
  readonly paging!: Paging
}

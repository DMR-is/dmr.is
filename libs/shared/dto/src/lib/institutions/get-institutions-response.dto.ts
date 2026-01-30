import { ApiProperty, OmitType } from '@nestjs/swagger'

import { Paging } from '../paging/paging.dto'
import { Institution } from './institution.dto'

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

export class GetInstitutionsFullResponse extends OmitType(
  GetInstitutionsResponse,
  ['paging'] as const,
) {}

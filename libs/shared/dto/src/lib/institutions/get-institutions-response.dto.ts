import { ApiProperty } from '@nestjs/swagger'
import { Institution } from './institution.dto'
import { Paging } from '../paging/paging.dto'

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

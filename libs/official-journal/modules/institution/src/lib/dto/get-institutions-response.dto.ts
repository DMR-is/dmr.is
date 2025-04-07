import { InstitutionDto } from '@dmr.is/official-journal/dto/institution/institution.dto'
import { Paging } from '@dmr.is/shared/dto'

import { ApiProperty } from '@nestjs/swagger'
export class GetInstitutions {
  @ApiProperty({
    description: 'List of involved parties',
    required: true,
    type: [InstitutionDto],
  })
  readonly institutions!: Array<InstitutionDto>

  @ApiProperty({
    description: 'Paging info',
    required: true,
    type: Paging,
  })
  readonly paging!: Paging
}

import { InstitutionDto } from '@dmr.is/official-journal/dto/institution/institution.dto'

import { ApiProperty } from '@nestjs/swagger'

export class GetInstitution {
  @ApiProperty({
    type: InstitutionDto,
    description: 'The institution that was found',
    required: true,
  })
  readonly institution!: InstitutionDto
}

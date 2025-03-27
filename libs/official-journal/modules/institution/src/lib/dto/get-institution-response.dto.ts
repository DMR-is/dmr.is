import { ApiProperty } from '@nestjs/swagger'

import { Institution } from './institution.dto'

export class GetInstitutionResponse {
  @ApiProperty({
    type: Institution,
    description: 'The institution that was found',
    required: true,
  })
  readonly institution!: Institution | null
}

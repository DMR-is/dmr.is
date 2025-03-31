import { Institution } from '@dmr.is/official-journal/dto'
import { ApiProperty } from '@nestjs/swagger'

export class GetInstitutionResponse {
  @ApiProperty({
    type: Institution,
    description: 'The institution that was found',
    required: true,
  })
  readonly institution!: Institution | null
}

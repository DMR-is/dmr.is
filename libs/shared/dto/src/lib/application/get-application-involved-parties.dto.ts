import { ApiProperty } from '@nestjs/swagger'

export class GetInvolvedPartiesForApplicationQuery {
  @ApiProperty({
    type: String,
    description: 'Name of the involved party',
    required: false,
  })
  partyName?: string
}

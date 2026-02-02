import { IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class UpdateCaseInvolvedPartyBody {
  @ApiProperty({
    type: String,
    description: 'Involved party id',
  })
  @IsUUID()
  involvedPartyId!: string
}

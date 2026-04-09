import { IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class AddCaseAdditionalPartyBody {
  @ApiProperty({
    type: String,
    description: 'Involved party id to add as additional party',
  })
  @IsUUID()
  involvedPartyId!: string
}

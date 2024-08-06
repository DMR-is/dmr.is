import { IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class UpdateCommunicationStatusBody {
  @ApiProperty({
    type: String,
    description: 'Status id',
  })
  @IsUUID()
  statusId!: string
}

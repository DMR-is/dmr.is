import { IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class UpdateNextStatusBody {
  @ApiProperty({
    type: String,
  })
  @IsUUID()
  currentStatus!: string
}

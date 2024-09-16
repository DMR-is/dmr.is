import { IsString } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class UpdateNextStatusBody {
  @ApiProperty({
    type: String,
  })
  @IsString()
  currentStatus!: string
}

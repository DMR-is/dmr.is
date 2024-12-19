import { IsOptional, IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class ApplicationUserQuery {
  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsUUID()
  involvedParty?: string
}

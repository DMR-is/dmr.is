import { IsOptional, IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class ApplicationUserQuery {
  @ApiProperty({
    type: String,
  })
  @IsOptional()
  @IsUUID()
  involvedParty?: string
}

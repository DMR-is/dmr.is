import { IsBoolean, IsString, IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class SubscriberDto {
  @ApiProperty({
    type: String,
  })
  @IsUUID()
  id!: string

  @ApiProperty({
    type: String,
  })
  @IsString()
  nationalId!: string

  @ApiProperty({
    type: Boolean,
  })
  @IsBoolean()
  isActive!: boolean
}

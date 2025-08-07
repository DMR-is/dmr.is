import { IsString, IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { Subscription } from '../../../guards/subscriber/subscriber.enum'

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
    enum: Subscription,
  })
  role!: Subscription
}

import { IsBoolean, IsEmail, IsOptional } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { ApiDateTime, ApiString } from '@dmr.is/decorators'
import { Paging } from '@dmr.is/shared-dto'

import { SubscriberDto } from '../../../models/subscriber.model'

export class GetSubscribersWithPagingResponse {
  @ApiProperty({
    type: [SubscriberDto],
  })
  subscribers!: SubscriberDto[]

  @ApiProperty({ type: Paging })
  paging!: Paging
}

export class CreateSubscriberAdminDto {
  @ApiString()
  nationalId!: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsEmail()
  email?: string

  @ApiDateTime()
  subscribedTo!: Date
}

export class UpdateSubscriberEndDateDto {
  @ApiDateTime()
  subscribedTo!: Date
}

export class GetSubscribersQueryDto {
  @ApiProperty({ type: Boolean, required: false, default: false })
  @IsOptional()
  @IsBoolean()
  includeInactive?: boolean
}

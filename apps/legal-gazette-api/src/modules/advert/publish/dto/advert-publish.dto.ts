import { IsArray, IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class AdvertPublishBulkDto {
  @ApiProperty({
    type: [String],
  })
  @IsArray()
  @IsUUID(undefined, { each: true })
  advertIds!: string[]
}

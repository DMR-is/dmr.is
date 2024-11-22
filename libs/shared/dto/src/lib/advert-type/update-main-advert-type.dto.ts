import { IsString } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class UpdateAdvertMainType {
  @ApiProperty({
    type: String,
    description: 'New title of the main advert type',
    required: true,
  })
  @IsString()
  title!: string
}

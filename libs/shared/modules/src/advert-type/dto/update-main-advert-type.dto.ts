import { IsString } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class UpdateMainAdvertTypeBody {
  @ApiProperty({
    type: String,
    description: 'New title of the main advert type',
    required: true,
  })
  @IsString()
  title!: string
}

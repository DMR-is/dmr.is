import { IsString } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class UpdateMainCategory {
  @ApiProperty({
    type: String,
    description: 'Title of the main category.',
    required: false,
  })
  @IsString()
  readonly title?: string

  @ApiProperty({
    type: String,
    description: 'Description of the main category',
    required: false,
  })
  @IsString()
  readonly description?: string
}

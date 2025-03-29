import { IsOptional, IsString } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class UpdateMainCategory {
  @ApiProperty({
    type: String,
    description: 'Title of the main category.',
    required: false,
  })
  @IsString()
  @IsOptional()
  readonly title?: string

  @ApiProperty({
    type: String,
    description: 'Description of the main category',
    required: false,
  })
  @IsString()
  @IsOptional()
  readonly description?: string

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  readonly departmentId?: string
}

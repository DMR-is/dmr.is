import { Transform } from 'class-transformer'
import { IsBoolean, IsOptional } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class GetUsersQueryDto {
  @ApiProperty({
    type: Boolean,
    required: false,
    description: 'When true, includes inactive users. Defaults to false.',
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  @IsBoolean()
  showInactive?: boolean
}

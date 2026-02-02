import { IsBoolean } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class UpdateCaseSignatureDateDisplayBody {
  @ApiProperty({
    type: Boolean,
    description: 'Hide signature date display',
  })
  @IsBoolean()
  hide!: boolean
}

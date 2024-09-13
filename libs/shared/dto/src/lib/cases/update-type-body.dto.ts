import { IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class UpdateCaseTypeBody {
  @ApiProperty({
    type: String,
    description: 'Type id',
  })
  @IsUUID()
  typeId!: string
}

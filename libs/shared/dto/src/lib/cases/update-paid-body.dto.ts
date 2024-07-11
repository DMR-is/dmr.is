import { IsBoolean, IsNotEmpty } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class UpdatePaidBody {
  @ApiProperty({
    type: Boolean,
  })
  @IsBoolean()
  @IsNotEmpty()
  paid!: boolean
}

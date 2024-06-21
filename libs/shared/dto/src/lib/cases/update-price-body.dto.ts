import { IsNumberString } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class UpdateCasePriceBody {
  @ApiProperty({
    type: String,
    description: 'Price',
    example: '1000',
  })
  @IsNumberString()
  price!: string
}

import { IsNumber } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class UpdateCasePriceBody {
  @ApiProperty({
    type: Number,
    description: 'Price',
    example: 12000,
  })
  @IsNumber()
  price!: number
}

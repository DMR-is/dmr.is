import { IsBoolean, IsNumber, IsString } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class GetPaymentQuery {
  @ApiProperty({
    type: String,
  })
  @IsString()
  debtorNationalId!: string

  @ApiProperty({
    type: String,
  })
  @IsString()
  chargeBase!: string
}

export class GetPaymentResponse {
  @ApiProperty({
    type: Boolean,
    description: 'Transaction has been paid',
  })
  @IsBoolean()
  paid!: boolean

  @ApiProperty({
    type: Boolean,
    description: 'Has the payment been created',
  })
  @IsBoolean()
  created!: boolean

  @ApiProperty({
    type: Boolean,
    description: 'Has the payment been canceled',
  })
  @IsBoolean()
  canceled!: boolean

  @ApiProperty({
    type: Number,
    description: 'How much is owed',
  })
  @IsNumber()
  capital!: number
}

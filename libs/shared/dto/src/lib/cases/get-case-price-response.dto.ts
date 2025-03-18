import { ApiProperty } from '@nestjs/swagger'

export class CasePriceResponse {
  @ApiProperty({
    description: 'The price of the case',
    required: true,
    type: Number,
  })
  readonly price!: number
}

export class CasePriceDetailResponse {
  @ApiProperty({
    description: 'The price of the case',
    required: true,
    type: Number,
  })
  readonly price!: number

  @ApiProperty({
    description: 'The base fee of the case',
    required: false,
    type: Number,
  })
  readonly baseFee!: number | null

  @ApiProperty({
    description: 'The character fee of the case',
    required: false,
    type: Number,
  })
  readonly characterFee!: number | null

  @ApiProperty({
    description: 'The additional document price of the case',
    required: false,
    type: Number,
  })
  readonly additionalDocPrice!: number | null

  @ApiProperty({
    description: 'The image tier price of the case',
    required: false,
    type: Number,
  })
  readonly imageTierPrice!: number | null
}

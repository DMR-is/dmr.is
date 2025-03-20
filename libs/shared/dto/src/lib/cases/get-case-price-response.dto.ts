import { ApiProperty } from '@nestjs/swagger'

export class CasePriceResponse {
  @ApiProperty({
    description: 'The price of the case',
    required: true,
    type: Number,
  })
  readonly price!: number
}

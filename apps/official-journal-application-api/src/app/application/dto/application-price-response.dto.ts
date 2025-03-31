import { ApiProperty } from '@nestjs/swagger'

export class ApplicationPriceResponse {
  @ApiProperty({
    type: Number,
  })
  price!: number
}

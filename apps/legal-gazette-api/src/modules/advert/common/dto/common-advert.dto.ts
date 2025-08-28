import { ApiProperty } from '@nestjs/swagger'

export class CommonAdvertDto {
  @ApiProperty({
    type: String,
  })
  caption!: string
}

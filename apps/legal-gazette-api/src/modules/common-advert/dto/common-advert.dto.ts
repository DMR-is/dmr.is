import { ApiProperty } from '@nestjs/swagger'

export class CommonAdvertSignatureDto {
  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String })
  location!: string

  @ApiProperty({ type: String })
  date!: string
}

export class CommonAdvertDto {
  @ApiProperty({
    type: String,
  })
  caption!: string

  @ApiProperty({
    type: CommonAdvertSignatureDto,
  })
  signature!: CommonAdvertSignatureDto
}

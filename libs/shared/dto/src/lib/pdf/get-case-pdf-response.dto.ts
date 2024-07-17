import { ApiProperty } from '@nestjs/swagger'

export class GetPdfUrlResponse {
  @ApiProperty({
    type: String,
  })
  url!: string
}

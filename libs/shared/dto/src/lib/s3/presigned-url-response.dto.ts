import { ApiProperty } from '@nestjs/swagger'

export class PresignedUrlResponse {
  @ApiProperty({
    type: String,
  })
  url!: string
}

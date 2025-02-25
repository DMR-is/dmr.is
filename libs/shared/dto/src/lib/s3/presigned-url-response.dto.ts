import { ApiProperty } from '@nestjs/swagger'

export class PresignedUrlResponse {
  @ApiProperty({
    type: String,
  })
  url!: string

  @ApiProperty({
    type: String,
    required: false,
  })
  cdn?: string

  @ApiProperty({
    type: String,
    required: false,
  })
  key?: string
}

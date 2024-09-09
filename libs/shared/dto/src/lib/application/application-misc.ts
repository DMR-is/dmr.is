import { ApiProperty } from '@nestjs/swagger'

export class ApplicationMisc {
  @ApiProperty({
    type: String,
  })
  signatureType!: string
}

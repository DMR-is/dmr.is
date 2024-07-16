import { ApiProperty } from '@nestjs/swagger'

export class GetCasePdfResponse {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'The PDF file',
  })
  pdf!: Buffer

  @ApiProperty({
    type: 'string',
    description: 'The URL to the PDF file',
  })
  url!: string
}

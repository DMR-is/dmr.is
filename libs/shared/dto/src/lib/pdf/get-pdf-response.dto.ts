import { ApiProperty } from '@nestjs/swagger'

export class GetPdfRespone {
  @ApiProperty({
    type: String,
    description: 'Base64 encoded PDF',
  })
  content!: string
}

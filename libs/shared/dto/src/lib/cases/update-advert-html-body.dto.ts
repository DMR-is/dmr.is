import { ApiProperty } from '@nestjs/swagger'

export class UpdateAdvertHtmlBody {
  @ApiProperty({
    type: String,
    description: 'Advert HTML',
  })
  advertHtml!: string
}

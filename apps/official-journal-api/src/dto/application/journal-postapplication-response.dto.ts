import { ApiProperty } from '@nestjs/swagger'
import { JournalAdvert } from '../adverts/journal-advert.dto'

export class JournalPostApplicationResponse {
  @ApiProperty({
    type: JournalAdvert,
    required: true,
    description: 'Return the submitted application',
  })
  advert!: JournalAdvert
}

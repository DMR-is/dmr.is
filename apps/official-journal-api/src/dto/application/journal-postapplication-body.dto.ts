import { ApiProperty } from '@nestjs/swagger'
import { JournalAdvert } from '../adverts/journal-advert.dto'

export class JournalPostApplicationBody {
  @ApiProperty({
    type: JournalAdvert,
    required: true,
    description: 'The application to post.',
  })
  application!: JournalAdvert
}

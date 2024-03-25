import { ApiProperty } from '@nestjs/swagger'
import { JournalAdvert } from '../adverts/journal-advert.dto'

export class JournalApplication {
  @ApiProperty({
    type: JournalAdvert,
    required: true,
    description: 'Application of type JournalAdvert.',
  })
  application!: JournalAdvert
}

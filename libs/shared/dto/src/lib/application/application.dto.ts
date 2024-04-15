import { ApiProperty } from '@nestjs/swagger'

import { Advert } from '../adverts/advert.dto'

export class Application {
  @ApiProperty({
    type: Advert,
    required: true,
    description: 'Application of type Advert.',
  })
  application!: Advert
}

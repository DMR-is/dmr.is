import { ApiProperty } from '@nestjs/swagger'

import { ApplicationAdvert } from './application-advert'
import { ApplicationMisc } from './application-misc'
import { ApplicationSignature } from './application-signature.dto'

export class ApplicationAnswers {
  @ApiProperty({
    type: ApplicationAdvert,
    description: 'Answers for the advert application',
  })
  advert!: ApplicationAdvert

  @ApiProperty({
    type: ApplicationMisc,
    description: 'Misc answers',
  })
  misc!: ApplicationMisc

  @ApiProperty({
    type: ApplicationSignature,
    description: 'Signature answers',
  })
  signatures!: ApplicationSignature
}
